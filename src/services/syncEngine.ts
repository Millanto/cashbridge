import { db, type LocalTransaction } from "./db";

// Simulated server API path.
// Under standard setup, we call our backend's sync API.
const SYNC_API_URL = "/api/v1/sync/transactions";

export class SyncEngine {
  private static onLogListeners: Array<(message: string) => void> = [];
  private static onStateChangeListeners: Array<(isOnline: boolean) => void> = [];
  private static isSyncing = false;

  /**
   * Register listeners for debug trace logging in UI tabs
   */
  public static addLogListener(callback: (msg: string) => void) {
    this.onLogListeners.push(callback);
  }

  public static removeLogListener(callback: (msg: string) => void) {
    this.onLogListeners = this.onLogListeners.filter((cb) => cb !== callback);
  }

  public static addStateListener(callback: (online: boolean) => void) {
    this.onStateChangeListeners.push(callback);
  }

  public static removeStateListener(callback: (online: boolean) => void) {
    this.onStateChangeListeners = this.onStateChangeListeners.filter((cb) => cb !== callback);
  }

  private static log(message: string) {
    const time = new Date().toLocaleTimeString();
    const formatted = `[${time}] ${message}`;
    this.onLogListeners.forEach((cb) => cb(formatted));
    console.info(formatted);
  }

  /**
   * Setup connectivity status tracking
   */
  public static init() {
    window.addEventListener("online", () => {
      this.log("🔌 Hardware network interface reports ONLINE connection.");
      this.onStateChangeListeners.forEach((cb) => cb(true));
      this.triggerAutoSync();
    });

    window.addEventListener("offline", () => {
      this.log("🚫 Hardware network interface reports OFFLINE connection.");
      this.onStateChangeListeners.forEach((cb) => cb(false));
    });
  }

  /**
   * Helper to write records offline
   */
  public static async recordTransactionOffline(tx: {
    description: string;
    amount: number;
    category: string;
    paymentMethod: "CASH" | "MOBILE_MONEY" | "CARD" | "DEBT";
  }): Promise<string> {
    const localId = `tx-local-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const offlineItem: LocalTransaction = {
      localId,
      description: tx.description,
      amount: tx.amount,
      category: tx.category,
      paymentMethod: tx.paymentMethod,
      offlineCreatedAt: new Date().toISOString(),
      synced: 0,
      syncFailed: 0,
      retryCount: 0
    };

    await db.transactions.add(offlineItem);
    this.log(`📝 Offline sale queued in IndexedDB: "${tx.description}" (${tx.amount} GHS) [localId: ${localId}]`);
    return localId;
  }

  /**
   * Automatically schedule sync drains once interface reconnects
   */
  public static triggerAutoSync() {
    if (this.isSyncing) return;
    this.log("🔄 Reconnection captured! Initiating automatic queue drain...");
    this.drainQueue().catch((err) => {
      this.log(`⚠️ Auto-sync background attempt halted: ${err.message}`);
    });
  }

  /**
   * Perform synchronization query towards our Express backend
   */
  public static async drainQueue(): Promise<boolean> {
    if (this.isSyncing) {
      this.log("⏳ Queue drain execution already in progress...");
      return false;
    }

    if (!navigator.onLine) {
      this.log("❌ Sync blocked: Navigator reports OFFLINE connection.");
      return false;
    }

    this.isSyncing = true;
    this.log("🚀 Starting Dexie synchronization engine...");

    try {
      // 1. Fetch unsynced transactions from indexedDB
      const unsyncedItems = await db.transactions
        .where("synced")
        .equals(0)
        .toArray();

      if (unsyncedItems.length === 0) {
        this.log("✅ Sync complete: All IndexedDB rows match cloud ledger database.");
        this.isSyncing = false;
        return true;
      }

      this.log(`📦 Bundling ${unsyncedItems.length} transactions for sync handshake batch...`);

      const payload = {
        deviceId: navigator.userAgent || "Web Client Core Engine",
        clientTimestamp: new Date().toISOString(),
        batch: unsyncedItems.map((item) => ({
          localId: item.localId,
          description: item.description,
          amount: item.amount,
          category: item.category,
          paymentMethod: item.paymentMethod,
          offlineCreatedAt: item.offlineCreatedAt
        }))
      };

      // 2. Transmit batch to Postgres gateway endpoint
      // Simulate/Trigger API calls safely. 
      // If we are displaying inside AI Studio sandbox without absolute server credentials, fallback to simulated API merges
      let results: any;
      try {
        const token = localStorage.getItem("auth_token") || "mock-trial-jwt-token";
        const response = await fetch(SYNC_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Sync Router responded with status: ${response.status}`);
        }

        const json = await response.json();
        results = json.data;
      } catch (networkErr: any) {
        this.log(`🔌 API endpoint handshake failed: ${networkErr.message}. Initiating fail-safe retry queues.`);
        
        // Process local backoff metrics for items in DB
        for (const item of unsyncedItems) {
          const nextRetry = item.retryCount + 1;
          const statusVal = nextRetry >= 3 ? 1 : 0; // mark as failed after 3 tries, preserving inside queue
          await db.transactions.update(item.id!, {
            retryCount: nextRetry,
            syncFailed: statusVal as 0 | 1,
            syncError: networkErr.message || "Intermittent network loss"
          });
        }
        
        this.isSyncing = false;
        throw networkErr;
      }

      // 3. Mark successful transactions in Dexie matching processedIds
      const processedIds: string[] = results.processedIds || [];
      const errorsList: any[] = results.errors || [];

      this.log(`📥 Backend response processed: ${results.summary.recordsSynced} synced, ${results.summary.duplicatesIgnored} duplicates ignored.`);

      for (const item of unsyncedItems) {
        if (processedIds.includes(item.localId)) {
          await db.transactions.update(item.id!, {
            synced: 1,
            syncFailed: 0,
            syncError: undefined
          });
        }
      }

      // 4. Mark conflict failure items with their parsed server error messages
      for (const errItem of errorsList) {
        const dbRecord = unsyncedItems.find((x) => x.localId === errItem.localId);
        if (dbRecord) {
          await db.transactions.update(dbRecord.id!, {
            syncFailed: 1,
            syncError: errItem.message || "Ledger constraint failed"
          });
          this.log(`❌ Conflict rejected on [localId: ${errItem.localId}]: ${errItem.message}`);
        }
      }

      this.log(`✨ Sync completed successfully. Queue successfully resolved.`);
      this.isSyncing = false;
      return true;

    } catch (err: any) {
      this.isSyncing = false;
      this.log(`🛑 Synchronization session aborted: ${err.message}`);
      return false;
    }
  }

  /**
   * Safe wipe of local memory store (for sandbox resets)
   */
  public static async resetLocalStore() {
    await db.transactions.clear();
    await db.syncQueue.clear();
    this.log("🧹 IndexedDB offline storage tables truncated.");
  }
}
