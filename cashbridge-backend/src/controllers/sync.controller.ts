import { Request, Response, NextFunction } from "express";
import { SyncService } from "../services/sync.service";

export class SyncController {
  /**
   * Accepts high velocity batch payload of offline transactions
   */
  public static async executeOfflineSync(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Access denied. Credentials unverified." });
      }

      const { deviceId, clientTimestamp, batch } = req.body;

      const result = await SyncService.syncClientSession(
        userId,
        deviceId,
        clientTimestamp,
        batch
      );

      return res.status(200).json({
        status: "success",
        message: "Offline transactions batch sync completed successfully.",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
