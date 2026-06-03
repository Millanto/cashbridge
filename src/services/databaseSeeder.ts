import { db } from "./db";

export class DatabaseSeeder {
  /**
   * Seed mock records into browser database if empty
   */
  public static async seedIfEmpty() {
    // 1. Check if customers are empty
    const customerCount = await db.customers.count();
    if (customerCount === 0) {
      console.log("🌱 Priming browser Dexie database with merchant mock records...");

      const mockCustomers = [
        {
          customerId: "cust-901",
          name: "Emmanuel Boateng",
          phone: "+233 54 881 2043",
          email: "emmanuel@kumasitraders.org",
          companyName: "K-Sankofa Cocoa Syndicate",
          registeredOffline: false,
          totalDebtGHS: 2400.00,
          remainingDebtGHS: 1400.00
        },
        {
          customerId: "cust-902",
          name: "Abena Mansa",
          phone: "+233 20 544 3110",
          email: "abena@mansatransport.com",
          companyName: "Mansa Cargo & Logistics",
          registeredOffline: false,
          totalDebtGHS: 4800.00,
          remainingDebtGHS: 4800.00
        },
        {
          customerId: "cust-903",
          name: "Kojo Owusu",
          phone: "+233 24 330 9182",
          email: "kojo.owusu@asanteagri.com",
          companyName: "Asante Agro-Inputs & Seeds",
          registeredOffline: false,
          totalDebtGHS: 0.00,
          remainingDebtGHS: 0.00
        },
        {
          customerId: "cust-904",
          name: "Esi Amankwah",
          phone: "+233 55 901 3244",
          email: "esi@ghanamarkets.com",
          companyName: "Amankwah General Provisions Giga-Store",
          registeredOffline: true,
          totalDebtGHS: 5250.00,
          remainingDebtGHS: 3150.00
        }
      ];

      await db.customers.bulkAdd(mockCustomers);

      // 2. Add realistic active outstanding debts
      const mockDebts = [
        {
          debtId: "debt-501",
          customerId: "cust-901",
          transactionId: "tx-local-seeded-01",
          amount: 2400.00,
          remainingAmount: 1400.00,
          status: "partial" as const,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 65 * 1000).toISOString()
        },
        {
          debtId: "debt-502",
          customerId: "cust-902",
          transactionId: "tx-local-seeded-02",
          amount: 4800.00,
          remainingAmount: 4800.00,
          status: "unpaid" as const,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 65 * 1000).toISOString()
        },
        {
          debtId: "debt-503",
          customerId: "cust-904",
          transactionId: "tx-local-seeded-03",
          amount: 5250.00,
          remainingAmount: 3150.00,
          status: "partial" as const,
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // overdue!
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 65 * 1000).toISOString()
        }
      ];

      await db.debts.bulkAdd(mockDebts);

      // 3. Add repayment tracking histories
      const mockRepayments = [
        {
          repaymentId: "rep-001",
          debtId: "debt-501",
          amount: 1000.00,
          paymentMethod: "MOBILE_MONEY" as const,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          repaymentId: "rep-002",
          debtId: "debt-503",
          amount: 2100.00,
          paymentMethod: "CASH" as const,
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      await db.repayments.bulkAdd(mockRepayments);

      // 4. Prime default offline ledger transaction activity log row items
      const mockTransactions = [
        {
          localId: "tx-local-seeded-01",
          description: "4 Bags Graded Cocoa Seeds (Boateng)",
          amount: 2400.00,
          category: "Sales",
          paymentMethod: "DEBT" as const,
          offlineCreatedAt: new Date(Date.now() - 10 * 24 * 60 * 65 * 1000).toISOString(),
          synced: 1 as const,
          syncFailed: 0 as const,
          retryCount: 0
        },
        {
          localId: "tx-local-seeded-02",
          description: "Bulk Fertilizer Consignment Delivery (Abena)",
          amount: 4800.00,
          category: "Inventory",
          paymentMethod: "DEBT" as const,
          offlineCreatedAt: new Date(Date.now() - 5 * 24 * 60 * 65 * 1000).toISOString(),
          synced: 1 as const,
          syncFailed: 0 as const,
          retryCount: 0
        },
        {
          localId: "tx-local-seeded-03",
          description: "Warehouse Utility Repairs Partitions (Esi)",
          amount: 5250.00,
          category: "Expenses",
          paymentMethod: "DEBT" as const,
          offlineCreatedAt: new Date(Date.now() - 12 * 24 * 60 * 65 * 1000).toISOString(),
          synced: 1 as const,
          syncFailed: 0 as const,
          retryCount: 0
        },
        {
          localId: "tx-local-01",
          description: "5 Bags Premium Organic Shea Butter Batch",
          amount: 1850.00,
          category: "Sales",
          paymentMethod: "MOBILE_MONEY" as const,
          offlineCreatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          synced: 0 as const,
          syncFailed: 0 as const,
          retryCount: 0
        },
        {
          localId: "tx-local-02",
          description: "Daily cocoa sorting labor wage payments",
          amount: 450.00,
          category: "Expenses",
          paymentMethod: "CASH" as const,
          offlineCreatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          synced: 0 as const,
          syncFailed: 0 as const,
          retryCount: 0
        },
        {
          localId: "tx-local-03",
          description: "Supplying 15 tons raw cocoa beans batch",
          amount: 14200.00,
          category: "Sales",
          paymentMethod: "MOBILE_MONEY" as const,
          offlineCreatedAt: new Date(Date.now() - 1 * 24 * 60 * 10 * 1000).toISOString(),
          synced: 1 as const,
          syncFailed: 0 as const,
          retryCount: 0
        },
        {
          localId: "tx-local-04",
          description: "Repurchase of protective gloves and overall gear",
          amount: 860.00,
          category: "Logistics",
          paymentMethod: "CARD" as const,
          offlineCreatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
          synced: 1 as const,
          syncFailed: 0 as const,
          retryCount: 0
        }
      ];

      await db.transactions.bulkAdd(mockTransactions);
    }
  }
}
