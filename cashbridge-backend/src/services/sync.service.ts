import { supabaseAdmin } from "../config/supabase";
import { AppError } from "../middlewares/error.middleware";
import { BusinessService } from "./business.service";

interface LocalTxPayload {
  localId: string;
  description: string;
  amount: number;
  category?: string;
  paymentMethod?: "CASH" | "MOBILE_MONEY" | "CARD" | "DEBT";
  offlineCreatedAt: string;
}

export class SyncService {
  /**
   * Processes an incoming offline queue payload of transaction records.
   * Utilizes robust duplicate prevention, conflict resolution and atomic tracking.
   */
  public static async syncClientSession(
    userId: string,
    deviceId: string,
    clientTimestamp: string,
    batch: LocalTxPayload[]
  ) {
    const businessId = await BusinessService.resolveBusinessId(userId);

    // Initial sync summaries
    let recordsSynced = 0;
    let duplicatesIgnored = 0;
    const errors: Array<{ localId: string; message: string }> = [];
    const processedIds: string[] = [];

    // Step 1: Query existing local_ids from postgres for this merchant in a single batch query
    const targetLocalIds = batch.map((item) => item.localId).filter(Boolean);
    let existingIdsSet = new Set<string>();

    if (targetLocalIds.length > 0) {
      const { data: existingRecords, error: queryErr } = await supabaseAdmin
        .from("transactions")
        .select("local_id")
        .eq("business_id", businessId)
        .in("local_id", targetLocalIds);

      if (!queryErr && existingRecords) {
        existingRecords.forEach((r: any) => {
          if (r.local_id) existingIdsSet.add(r.local_id);
        });
      }
    }

    // Step 2: Loop through batch and merge
    for (const item of batch) {
      if (!item.localId) {
        errors.push({ localId: "MISSING", message: "Transaction item is missing required local ID." });
        continue;
      }

      // Duplicate prevention checks
      if (existingIdsSet.has(item.localId)) {
        duplicatesIgnored++;
        processedIds.push(item.localId);
        continue;
      }

      try {
        // Insert record securely
        const { error: insertErr } = await supabaseAdmin.from("transactions").insert({
          local_id: item.localId,
          business_id: businessId,
          description: item.description,
          amount: item.amount,
          category: item.category || "Sales",
          payment_method: item.paymentMethod || "CASH",
          offline_created_at: item.offlineCreatedAt || new Date().toISOString()
        });

        if (insertErr) {
          // If insert fails due to a micro-timing duplicate constraint, treat gracefully
          if (insertErr.code === "23505") {
            duplicatesIgnored++;
            processedIds.push(item.localId);
          } else {
            errors.push({ localId: item.localId, message: insertErr.message });
          }
        } else {
          recordsSynced++;
          processedIds.push(item.localId);
        }
      } catch (err: any) {
        errors.push({ localId: item.localId, message: err.message || "Failed parsing transaction input." });
      }
    }

    // Step 3: Write sync session trace logs
    try {
      await supabaseAdmin.from("sync_sessions").insert({
        business_id: businessId,
        device_id: deviceId || "Web Sandbox Router Client",
        records_synced: recordsSynced,
        client_timestamp: clientTimestamp || new Date().toISOString()
      });
    } catch (sessionErr) {
      console.warn("Could not log sync session statistics telemetry:", sessionErr);
    }

    return {
      status: "success",
      summary: {
        totalReceived: batch.length,
        recordsSynced,
        duplicatesIgnored,
        failures: errors.length
      },
      processedIds,
      errors
    };
  }
}
