import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { PaymentService } from "../services/payment.service";

export class PaymentController {
  /**
   * Initializes high-velocity cash-ins (INBOUND) or payout settlements (OUTBOUND)
   */
  public static async initializePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Access denied. Credentials unverified." });
      }

      const result = await PaymentService.initializePayment(userId, req.body);
      return res.status(200).json({
        status: "success",
        message: "Payment transaction successfully initialized.",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Triggers explicit state polls validating transaction statuses directly
   */
  public static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { reference } = req.params;
      const result = await PaymentService.verifyAndProcessPayment(reference);

      return res.status(200).json({
        status: "success",
        message: "State verification check completed successfully.",
        data: {
          reference,
          status: result.status,
          message: result.message,
          log: result.data || null
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public webhook endpoint parsing Paystack notification web-push streams
   */
  public static async handlePaystackWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Validate Paystack Webhook Cryptographic Signatures for strict security
      const paystackSignature = req.headers["x-paystack-signature"] as string;
      const secret = process.env.PAYSTACK_SECRET_KEY || "";

      if (secret && paystackSignature) {
        const hash = crypto
          .createHmac("sha512", secret)
          .update(JSON.stringify(req.body))
          .digest("hex");

        if (hash !== paystackSignature) {
          console.error("[CRITICAL WEBHOOK ERROR] Paystack signature mismatch validation aborted!");
          return res.status(400).json({ status: "fail", error: "Unauthorized endpoint signature." });
        }
      }

      const webhookData = req.body;
      const reference = webhookData.data?.reference;

      if (!reference) {
        console.warn("[WEBHOOK NOTICE] Paystack payload missing reference code.");
        return res.status(200).json({ status: "skipped", message: "Parsed reference empty." });
      }

      console.info(`[PAYSTACK WEBHOOK STREAMING] Reference resolved: ${reference}, Event: ${webhookData.event}`);

      // 2. Perform async thread logic and settle ledger accounts
      const result = await PaymentService.verifyAndProcessPayment(reference, webhookData);

      return res.status(200).json({
        status: "success",
        message: "Webhook processed and ledger balanced.",
        details: result.message
      });
    } catch (error: any) {
      console.error(`[WEBHOOK FAILURE EXCEPTION] Error: ${error.message}`);
      // Return 200 to gateway so they do not continuously flood retry endpoints with network load
      return res.status(200).json({ status: "fail", error: error.message });
    }
  }

  /**
   * Webhook parsing MTN mobile money push transactions
   */
  public static async handleMtnMoMoWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      console.info("[MTN MOMO WEBHOOK EVENT RECEIVED]");
      const webhookPayload = req.body;
      const reference = webhookPayload.referenceId || webhookPayload.externalId;

      if (!reference) {
        return res.status(200).json({ status: "skipped", message: "No reference provided on body." });
      }

      const result = await PaymentService.verifyAndProcessPayment(reference, webhookPayload);

      return res.status(200).json({
        status: "success",
        message: "MTN feedback captured and ledger resolved.",
        details: result.message
      });
    } catch (error: any) {
      console.error(`[MTN WEBHOOK ERROR] Error: ${error.message}`);
      return res.status(200).json({ status: "fail", error: error.message });
    }
  }

  /**
   * Lists the merchant push history journals corresponding to users' business scopes
   */
  public static async listPaymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Access denied. Credentials unverified." });
      }

      const status = req.query.status as string || undefined;
      const data = await PaymentService.queryPaymentHistory(userId, status);

      return res.status(200).json({
        status: "success",
        data
      });
    } catch (error) {
      next(error);
    }
  }
}
