import { supabaseAdmin } from "../config/supabase";
import { AppError } from "../middlewares/error.middleware";

export interface TransactionFilters {
  category?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class BusinessService {
  /**
   * Helper resolving a merchant user UUID to their corresponding business record ID
   */
  public static async resolveBusinessId(userId: string): Promise<string> {
    const { data: business, error } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (error || !business) {
      throw new AppError("Failed to authenticate transaction. No registered business profile matches your credentials.", 404);
    }
    return business.id;
  }

  /**
   * Records a core bookkeeping transaction
   */
  public static async createTransaction(userId: string, data: {
    localId?: string;
    customerId?: string;
    description: string;
    amount: number;
    category: string;
    paymentMethod: string;
    offlineCreatedAt?: string;
  }) {
    const businessId = await this.resolveBusinessId(userId);

    // 1. Prevent sync duplicates using IndexedDB client generated unique keys
    if (data.localId) {
      const { data: duplicate } = await supabaseAdmin
        .from("transactions")
        .select("id")
        .eq("local_id", data.localId)
        .maybeSingle();

      if (duplicate) {
        return duplicate; // Gracefully bypass write and return original key
      }
    }

    // 2. Perform write operation
    const { data: tx, error } = await supabaseAdmin
      .from("transactions")
      .insert({
        local_id: data.localId || null,
        business_id: businessId,
        customer_id: data.customerId || null,
        description: data.description,
        amount: data.amount,
        category: data.category,
        payment_method: data.paymentMethod,
        offline_created_at: data.offlineCreatedAt || new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("[TX SERVICE EXCEPTION] Error committing row:", error.message);
      throw new AppError(`Failed to save transaction entry: ${error.message}`, 500);
    }
    return tx;
  }

  /**
   * Generates a new customer ledger card
   */
  public static async createCustomer(userId: string, data: { name: string; phoneNumber?: string }) {
    const businessId = await this.resolveBusinessId(userId);

    const { data: customer, error } = await supabaseAdmin
      .from("customers")
      .insert({
        business_id: businessId,
        name: data.name,
        phone_number: data.phoneNumber || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Customer registration failed: ${error.message}`, 500);
    }
    return customer;
  }

  /**
   * Lists all customers registered under a merchant's trade store
   */
  public static async listCustomers(userId: string) {
    const businessId = await this.resolveBusinessId(userId);

    const { data, error } = await supabaseAdmin
      .from("customers")
      .select("*, debts(amount_total, amount_paid, status)")
      .eq("business_id", businessId)
      .order("name", { ascending: true });

    if (error) {
      throw new AppError(`Failed to fetch customer cohorts: ${error.message}`, 500);
    }
    return data;
  }

  /**
   * Records a client credit debt ledger
   */
  public static async createDebt(userId: string, data: {
    customerId: string;
    amountTotal: number;
    dueDate?: string;
  }) {
    const businessId = await this.resolveBusinessId(userId);

    // Verify target customer exists and lives under this same business context
    const { data: customer, error: custError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("id", data.customerId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (custError || !customer) {
      throw new AppError("Debt allocation denied. Referenced customer could not be resolved or belongs to another store.", 404);
    }

    // Insert debt row
    const { data: debt, error } = await supabaseAdmin
      .from("debts")
      .insert({
        customer_id: data.customerId,
        business_id: businessId,
        amount_total: data.amountTotal,
        amount_paid: 0.00,
        status: "UNPAID",
        due_date: data.dueDate || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to establish debt registry: ${error.message}`, 500);
    }

    // Update customer's active debt flag
    await supabaseAdmin
      .from("customers")
      .update({ debt_active: true, updated_at: new Date().toISOString() })
      .eq("id", data.customerId);

    // Also, record transaction booking entry under 'DEBT' payment method
    await this.createTransaction(userId, {
      customerId: data.customerId,
      description: `Debt allocated: Customer credit balance recorded`,
      amount: -data.amountTotal, // Negative representation of credit/inventory outflow
      category: "Sales",
      paymentMethod: "DEBT"
    });

    return debt;
  }

  /**
   * Updates an outstanding invoice/debt with dynamic credit clearance payments
   */
  public static async recordRepayment(userId: string, debtId: string, data: {
    amountPaid: number;
    paymentMethod: string;
  }) {
    const businessId = await this.resolveBusinessId(userId);

    // 1. Retrieve current debt status parameters
    const { data: debt, error } = await supabaseAdmin
      .from("debts")
      .select("*, customers(name)")
      .eq("id", debtId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error || !debt) {
      throw new AppError("Target debt index is missing or access is unauthorized.", 404);
    }

    // 2. Prevent over-clearance calculations
    const updatedPaid = Number(debt.amount_paid) + data.amountPaid;
    if (updatedPaid > Number(debt.amount_total)) {
      throw new AppError(`Repayment rejected: Overpayment of GHS ${updatedPaid - debt.amount_total} details detected.`, 400);
    }

    let status = "PARTIALLY_PAID";
    if (updatedPaid === Number(debt.amount_total)) {
      status = "SETTLED";
    }

    // 3. Atomically update database values
    const { data: updatedDebt, error: updateError } = await supabaseAdmin
      .from("debts")
      .update({
        amount_paid: updatedPaid,
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq("id", debtId)
      .select()
      .single();

    if (updateError) {
      throw new AppError(`Failed to update debt registry: ${updateError.message}`, 500);
    }

    // 4. Update parent client's debt marker if settling in full
    if (status === "SETTLED") {
      // Check if this customer holds any other active outstanding unpaid debts
      const { data: otherDebts } = await supabaseAdmin
        .from("debts")
        .select("id")
        .eq("customer_id", debt.customer_id)
        .neq("status", "SETTLED");

      if (!otherDebts || otherDebts.length === 0) {
        await supabaseAdmin
          .from("customers")
          .update({ debt_active: false, updated_at: new Date().toISOString() })
          .eq("id", debt.customer_id);
      }
    }

    // 5. Register in incoming cash ledger transactions mapping incoming funds directly
    await this.createTransaction(userId, {
      customerId: debt.customer_id,
      description: `Debt repayment: Settlement of outstanding invoice from ${debt.customers?.name || "Client"}`,
      amount: data.amountPaid, // Positive cash arrival
      category: "Sales",
      paymentMethod: data.paymentMethod
    });

    return updatedDebt;
  }

  /**
   * Retrieves paginated bookkeeping transaction history
   */
  public static async getTransactionHistory(userId: string, filters: TransactionFilters) {
    const businessId = await this.resolveBusinessId(userId);

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("transactions")
      .select("*, customers(name, phone_number)", { count: "exact" })
      .eq("business_id", businessId);

    // Apply conditional filters
    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.paymentMethod) {
      query = query.eq("payment_method", filters.paymentMethod);
    }
    if (filters.startDate) {
      query = query.gte("offline_created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("offline_created_at", filters.endDate);
    }

    // Order results chronologically
    const { data, count, error } = await query
      .order("offline_created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(`Error fetching transaction history logs: ${error.message}`, 500);
    }

    return {
      transactions: data,
      pagination: {
        totalItems: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  /**
   * Aggregates real-time financial stats for merchant dashboards
   */
  public static async getAnalyticsSummary(userId: string) {
    const businessId = await this.resolveBusinessId(userId);

    // Fetch all transactions to form math analytics
    const { data: txs, error: txError } = await supabaseAdmin
      .from("transactions")
      .select("amount, category, payment_method, offline_created_at")
      .eq("business_id", businessId);

    if (txError) {
      throw new AppError(`Error generating engine analytics: ${txError.message}`, 500);
    }

    // Fetch total active customer debt totals
    const { data: unpaidDebts, error: debtError } = await supabaseAdmin
      .from("debts")
      .select("amount_total, amount_paid")
      .eq("business_id", businessId)
      .neq("status", "SETTLED");

    if (debtError) {
      throw new AppError(`Error fetching business liability indexes: ${debtError.message}`, 500);
    }

    let rawRevenue = 0;
    let rawExpenses = 0;

    const channelSummary: Record<string, number> = {
      CASH: 0,
      MOBILE_MONEY: 0,
      CARD: 0,
      DEBT: 0
    };

    txs?.forEach((t) => {
      const amt = Number(t.amount);
      if (amt > 0) {
        rawRevenue += amt;
      } else {
        rawExpenses += Math.abs(amt);
      }

      const method = t.payment_method || "CASH";
      if (channelSummary[method] !== undefined) {
        channelSummary[method] += amt;
      }
    });

    let outstandingDebtValue = 0;
    unpaidDebts?.forEach((d) => {
      outstandingDebtValue += (Number(d.amount_total) - Number(d.amount_paid));
    });

    return {
      financials: {
        totalRevenue: rawRevenue,
        totalExpenses: rawExpenses,
        netCashflow: rawRevenue - rawExpenses,
        outstandingDebt: outstandingDebtValue
      },
      paymentMethodShare: channelSummary,
      ledgerCount: txs?.length || 0
    };
  }
}
