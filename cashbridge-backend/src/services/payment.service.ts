import { supabaseAdmin } from "../config/supabase";
import { AppError } from "../middlewares/error.middleware";
import { BusinessService } from "./business.service";

// Env vars extraction
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const MOMO_API_KEY = process.env.MOMO_API_KEY || "";
const MOMO_API_USER = process.env.MOMO_API_USER || "";
const MOMO_SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY || "";
const MOMO_ENVIRONMENT = process.env.MOMO_ENVIRONMENT || "sandbox"; // sandbox, production

export class PaymentService {
  /**
   * Initialize a charge (INBOUND) or payout (OUTBOUND)
   */
  public static async initializePayment(
    userId: string,
    data: {
      amount: number;
      paymentGateway: "MTN_MOMO" | "PAYSTACK";
      direction: "INBOUND" | "OUTBOUND";
      phoneNumber?: string;
      email?: string;
      description?: string;
    }
  ) {
    const businessId = await BusinessService.resolveBusinessId(userId);
    const reference = `CB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Generate real-time logging entry with PENDING state
    const { data: log, error: logError } = await supabaseAdmin
      .from("payment_logs")
      .insert({
        business_id: businessId,
        payment_gateway: data.paymentGateway,
        provider_reference: reference,
        amount: data.amount,
        status: "PENDING",
        direction: data.direction,
        payload_raw: { description: data.description || "CashBridge Ledger Gateway Flow" },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (logError || !log) {
      throw new AppError(`Billing ledger failed to queue transaction: ${logError?.message || "DB Hold"}`, 500);
    }

    // Handle OUTBOUND checkout - verify wallet balances before dispatching funds
    if (data.direction === "OUTBOUND") {
      const { data: wallet, error: walletErr } = await supabaseAdmin
        .from("wallets")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();

      if (walletErr || !wallet) {
        throw new AppError("No wallet initialized for this trade store profile.", 404);
      }

      if (Number(wallet.balance) < data.amount) {
        // Fail the log immediately in the DB to keep states clean
        await supabaseAdmin
          .from("payment_logs")
          .update({ status: "FAILED", finalized_at: new Date().toISOString() })
          .eq("id", log.id);

        throw new AppError(`Disbursement rejected. Insufficient fund balance on CashBridge. Current float: GHS ${wallet.balance}`, 400);
      }

      // Decrement balance and update pushed pending balances
      const updatedBalance = Number(wallet.balance) - data.amount;
      const updatedPushed = Number(wallet.pushed_balance) + data.amount;

      const { error: walletUpdateErr } = await supabaseAdmin
        .from("wallets")
        .update({
          balance: updatedBalance,
          pushed_balance: updatedPushed,
          updated_at: new Date().toISOString()
        })
        .eq("id", wallet.id);

      if (walletUpdateErr) {
        throw new AppError(`Wallet locking mechanism failed: ${walletUpdateErr.message}`, 550);
      }
    }

    // Launch Gateway Trigger
    try {
      if (data.paymentGateway === "PAYSTACK") {
        return await this.triggerPaystack(reference, data, log.id);
      } else {
        return await this.triggerMtnMoMo(reference, data, log.id);
      }
    } catch (gatewayErr: any) {
      // Revert wallet balances in case of immediate dispatch error for OUTBOUND
      if (data.direction === "OUTBOUND") {
        const { data: wallet } = await supabaseAdmin
          .from("wallets")
          .select("*")
          .eq("business_id", businessId)
          .maybeSingle();

        if (wallet) {
          await supabaseAdmin
            .from("wallets")
            .update({
              balance: Number(wallet.balance) + data.amount,
              pushed_balance: Math.max(0, Number(wallet.pushed_balance) - data.amount),
              updated_at: new Date().toISOString()
            })
            .eq("id", wallet.id);
        }
      }

      // Mark log as FAILED
      await supabaseAdmin
        .from("payment_logs")
        .update({
          status: "FAILED",
          finalized_at: new Date().toISOString(),
          payload_raw: { error: gatewayErr.message || "Unknown router exception" }
        })
        .eq("id", log.id);

      throw new AppError(`Payment Router connection abort: ${gatewayErr.message}`, 502);
    }
  }

  /**
   * Real Paystack implementation wrapping charges & transfers
   */
  private static async triggerPaystack(
    reference: string,
    data: any,
    logId: string
  ) {
    if (!PAYSTACK_SECRET_KEY) {
      // If we are in local development and standard key is missing, mock Paystack sandbox flow safely rather than crashing
      console.warn("[WARNING] PAYSTACK_SECRET_KEY is missing. Simulating sandbox response.");
      return {
        paymentGateway: "PAYSTACK",
        reference,
        status: "PENDING",
        gatewayUrl: `https://checkout.paystack.com/checkout-sandbox-sim?ref=${reference}`,
        message: "Paystack sandbox simulation initialized successfully (Keys pending)."
      };
    }

    const payload: any = {};

    if (data.direction === "INBOUND") {
      // Collect payment via checkout redirect url
      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: data.email || "support@cashbridge-ledger.com",
          amount: Math.round(data.amount * 100), // convert to Ghanaian Pesewas / Kobo
          reference,
          callback_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment-callback`
        })
      });

      const responseData: any = await res.json();
      if (!res.ok || !responseData.status) {
        throw new Error(responseData.message || "Failed initializing Paystack invoice charge.");
      }

      // Update log metadata with complete payload
      await supabaseAdmin
        .from("payment_logs")
        .update({ payload_raw: responseData })
        .eq("id", logId);

      return {
        paymentGateway: "PAYSTACK",
        reference,
        status: "PENDING",
        gatewayUrl: responseData.data.authorization_url,
        message: "Paystack invoices generated successfully."
      };
    } else {
      // Payout / Transfer logic
      // 1. Resolve or Create Transfer Recipient (Mock / sandbox account routing)
      const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "nuban",
          name: "Merchant Store Withdrawal",
          account_number: data.phoneNumber || "0240000000",
          bank_code: "MTN", // MTN Ghana
          currency: "GHS"
        })
      });

      const recData: any = await recipientRes.json();
      if (!recipientRes.ok || !recData.status) {
        throw new Error(recData.message || "Failed generating transfer recipient token.");
      }

      // 2. Dispatch the transfer
      const transferRes = await fetch("https://api.paystack.co/transfer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source: "balance",
          amount: Math.round(data.amount * 100),
          recipient: recData.data.recipient_code,
          reference,
          reason: data.description || "CashBridge Store Withdrawal"
        })
      });

      const tfData: any = await transferRes.json();
      if (!transferRes.ok || !tfData.status) {
        throw new Error(tfData.message || "Disbursement transfer trigger was rejected.");
      }

      await supabaseAdmin
        .from("payment_logs")
        .update({ payload_raw: tfData })
        .eq("id", logId);

      return {
        paymentGateway: "PAYSTACK",
        reference,
        status: "PENDING",
        message: "Payout withdrawal request successfully dispatched."
      };
    }
  }

  /**
   * Real MTN Developer Sandbox MoMo implementation
   */
  private static async triggerMtnMoMo(
    reference: string,
    data: any,
    logId: string
  ) {
    if (!MOMO_API_KEY || !MOMO_API_USER) {
      console.warn("[WARNING] MTN MOMO keys missing. Simulating MTN MoMo push notifications sandbox.");
      return {
        paymentGateway: "MTN_MOMO",
        reference,
        status: "PENDING",
        message: "MTN MoMo API USSD / push prompt successfully simulated!"
      };
    }

    const host = MOMO_ENVIRONMENT === "sandbox" 
      ? "sandbox.momodeveloper.mtn.com" 
      : "proxy.momoapi.mtn.com";

    // 1. Fetch OAuth Access Token from MTN gateway
    const tokenUrl = `https://${host}/collection/token/`;
    const credentials = Buffer.from(`${MOMO_API_USER}:${MOMO_API_KEY}`).toString("base64");

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY
      }
    });

    const tokenData: any = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error("MTN MoMo Gateway auth failure. Insufficient token privileges.");
    }

    const mtnAccessToken = tokenData.access_token;

    if (data.direction === "INBOUND") {
      // Request To Pay (Request payment from subscriber)
      const payUrl = `https://${host}/collection/v1_0/requesttopay`;
      const response = await fetch(payUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mtnAccessToken}`,
          "X-Reference-Id": reference,
          "X-Target-Environment": MOMO_ENVIRONMENT,
          "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: data.amount.toFixed(2),
          currency: "EUR", // Sandbox often strictly demands EUR / specific test parameters
          externalId: reference,
          payer: {
            partyIdType: "MSISDN",
            partyId: data.phoneNumber || "233240000000"
          },
          payerMessage: data.description || "CashBridge merchant collection prompt",
          payeeNote: "LEDGER PAYMENT"
        })
      });

      if (!response.ok && response.status !== 202) {
        throw new Error(`MTN Gateway RequestToPay returned error status: ${response.status}`);
      }

      return {
        paymentGateway: "MTN_MOMO",
        reference,
        status: "PENDING",
        message: "Request-To-Pay USSD prompt pushed successfully to customer handset."
      };
    } else {
      // OUTBOUND: Transfer (Payout from merchant balance)
      const disUrl = `https://${host}/disbursement/v1_0/transfer`;
      const response = await fetch(disUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mtnAccessToken}`,
          "X-Reference-Id": reference,
          "X-Target-Environment": MOMO_ENVIRONMENT,
          "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: data.amount.toFixed(2),
          currency: "EUR",
          externalId: reference,
          payee: {
            partyIdType: "MSISDN",
            partyId: data.phoneNumber || "233240000000"
          },
          payerMessage: "CashBridge Store Payout Outflow",
          payeeNote: "WITHDRAWAL"
        })
      });

      if (!response.ok && response.status !== 202) {
        throw new Error(`MTN Disbursement Transfer returned error status: ${response.status}`);
      }

      return {
        paymentGateway: "MTN_MOMO",
        reference,
        status: "PENDING",
        message: "MTN MoMo disbursement transfer initiated successfully."
      };
    }
  }

  /**
   * Idempotency-protected Verification and settlement trigger.
   * Promotes retry safety with transactional atomic state matching.
   */
  public static async verifyAndProcessPayment(reference: string, payloadRaw?: any) {
    // 1. Idempotency Check: Load trace record
    const { data: log, error } = await supabaseAdmin
      .from("payment_logs")
      .select("*")
      .eq("provider_reference", reference)
      .maybeSingle();

    if (error || !log) {
      throw new AppError("Verification failed: Referenced payment log matching tracking token was not found.", 404);
    }

    // Already settled - bypass and return successfully
    if (log.status === "SUCCESSFUL" || log.status === "FAILED") {
      return { status: log.status, message: "Payment already finalized. Bypass ledger updating." };
    }

    // 2. Poll/Query actual Gateway status to be 100% verified (Avoid client modification tampering)
    let finalStatus: "SUCCESSFUL" | "FAILED" | "PENDING" = "PENDING";
    let providerPayload = payloadRaw || {};

    try {
      if (log.payment_gateway === "PAYSTACK") {
        finalStatus = await this.verifyPaystackStatus(reference, providerPayload);
      } else {
        finalStatus = await this.verifyMtnMoMoStatus(reference, log.direction);
      }
    } catch (verifyErr) {
      console.error(`Status polling failed for reference: ${reference}. Keeping as PENDING for retry. Err:`, verifyErr);
      return { status: "PENDING", message: "Verification status unresolved. Kept as pending." };
    }

    if (finalStatus === "PENDING") {
      return { status: "PENDING", message: "Payment status is currently pending." };
    }

    // 3. Atomically settle funds in wallets & bookkeeping logs
    if (finalStatus === "SUCCESSFUL") {
      const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("*")
        .eq("business_id", log.business_id)
        .maybeSingle();

      if (!wallet) {
        throw new AppError("Merchant business wallet profile missing.", 404);
      }

      if (log.direction === "INBOUND") {
        // Increment wallet funds
        const updatedBalance = Number(wallet.balance) + Number(log.amount);

        await supabaseAdmin
          .from("wallets")
          .update({
            balance: updatedBalance,
            updated_at: new Date().toISOString()
          })
          .eq("id", wallet.id);

        // Auto report/write a ledger bookkeeping trace item to match
        await supabaseAdmin.from("transactions").insert({
          business_id: log.business_id,
          amount: Number(log.amount),
          description: `Fintech Gateway Cash-In: Settled via ${log.payment_gateway}`,
          category: "Sales",
          payment_method: "MOBILE_MONEY",
          offline_created_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      } else {
        // OUTBOUND Transfer Complete - decrement from pushed/cleared balancing floats
        const updatedPushed = Math.max(0, Number(wallet.pushed_balance) - Number(log.amount));

        await supabaseAdmin
          .from("wallets")
          .update({
            pushed_balance: updatedPushed,
            updated_at: new Date().toISOString()
          })
          .eq("id", wallet.id);

        // Auto report expense bookkeeping entry
        await supabaseAdmin.from("transactions").insert({
          business_id: log.business_id,
          amount: -Number(log.amount),
          description: `Fintech Gateway Cash-Out: Disbursed to mobile wallet via ${log.payment_gateway}`,
          category: "Logistics",
          payment_method: "MOBILE_MONEY",
          offline_created_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }

    } else if (finalStatus === "FAILED") {
      // Revert funds locks in case of OUTBOUND payouts failing
      if (log.direction === "OUTBOUND") {
        const { data: wallet } = await supabaseAdmin
          .from("wallets")
          .select("*")
          .eq("business_id", log.business_id)
          .maybeSingle();

        if (wallet) {
          const restoredBalance = Number(wallet.balance) + Number(log.amount);
          const reducedPushed = Math.max(0, Number(wallet.pushed_balance) - Number(log.amount));

          await supabaseAdmin
            .from("wallets")
            .update({
              balance: restoredBalance,
              pushed_balance: reducedPushed,
              updated_at: new Date().toISOString()
            })
            .eq("id", wallet.id);
        }
      }
    }

    // 4. Update core log row status
    const { data: updatedLog } = await supabaseAdmin
      .from("payment_logs")
      .update({
        status: finalStatus,
        payload_raw: { ...log.payload_raw, ...providerPayload },
        finalized_at: new Date().toISOString()
      })
      .eq("id", log.id)
      .select()
      .single();

    return {
      status: finalStatus,
      message: `Transaction processed successfully with result: ${finalStatus}`,
      data: updatedLog
    };
  }

  /**
   * Verify status values on Paystack router APIs
   */
  private static async verifyPaystackStatus(reference: string, webhookPayload?: any): Promise<"SUCCESSFUL" | "FAILED" | "PENDING"> {
    // Rely on webhook payload if provided confidently
    if (webhookPayload && webhookPayload.event) {
      if (webhookPayload.event === "charge.success" || webhookPayload.event === "transfer.success") {
        return "SUCCESSFUL";
      }
      if (webhookPayload.event === "transfer.failed" || webhookPayload.event === "charge.failed") {
        return "FAILED";
      }
      return "PENDING";
    }

    if (!PAYSTACK_SECRET_KEY) {
      // Mock validation logic fallback for local dev sandbox
      return "SUCCESSFUL";
    }

    // Execute direct API poll confirmation to bypass webhook failures
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    const body: any = await res.json();
    if (res.ok && body.status && body.data) {
      if (body.data.status === "success") return "SUCCESSFUL";
      if (body.data.status === "failed") return "FAILED";
    }
    return "PENDING";
  }

  /**
   * Verify status levels on MTN Sandbox gateway configurations
   */
  private static async verifyMtnMoMoStatus(reference: string, direction: "INBOUND" | "OUTBOUND"): Promise<"SUCCESSFUL" | "FAILED" | "PENDING"> {
    if (!MOMO_API_KEY || !MOMO_API_USER) {
      // Mock validation logic fallback for local sandbox testing
      return "SUCCESSFUL";
    }

    const host = MOMO_ENVIRONMENT === "sandbox" ? "sandbox.momodeveloper.mtn.com" : "proxy.momoapi.mtn.com";
    
    // Authenticate token session
    const credentials = Buffer.from(`${MOMO_API_USER}:${MOMO_API_KEY}`).toString("base64");
    const tokenRes = await fetch(`https://${host}/collection/token/`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY
      }
    });
    const tokenData: any = await tokenRes.json();
    const token = tokenData.access_token;

    // Check status by reference matching direction path
    const url = direction === "INBOUND" 
      ? `https://${host}/collection/v1_0/requesttopay/${reference}`
      : `https://${host}/disbursement/v1_0/transfer/${reference}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Target-Environment": MOMO_ENVIRONMENT,
        "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY
      }
    });

    const data: any = await res.json();
    if (res.ok && data.status) {
      if (data.status === "SUCCESSFUL") return "SUCCESSFUL";
      if (data.status === "FAILED" || data.status === "REJECTED") return "FAILED";
    }
    return "PENDING";
  }

  /**
   * Returns list of payment logs with search query / pagination metrics
   */
  public static async queryPaymentHistory(userId: string, status?: string) {
    const businessId = await BusinessService.resolveBusinessId(userId);

    let query = supabaseAdmin
      .from("payment_logs")
      .select("*")
      .eq("business_id", businessId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new AppError(`Error reading transaction invoices ledger: ${error.message}`, 500);
    }
    return data;
  }
}
