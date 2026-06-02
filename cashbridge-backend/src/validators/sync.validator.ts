import { z } from "zod";

export const syncPayloadSchema = z.object({
  body: z.object({
    deviceId: z.string().optional().default("Web Browser Client"),
    clientTimestamp: z.string().datetime({ message: "client_timestamp must be in valid ISO-8601 UTC format." }),
    batch: z.array(
      z.object({
        localId: z.string().min(3, { message: "localId must hold at least 3 characters." }),
        description: z.string().min(2, { message: "Sale Description must hold at least 2 characters." }),
        amount: z.number({ message: "GHS price amount must be a number." }),
        category: z.string().optional().default("Sales"),
        paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "CARD", "DEBT"]).optional().default("CASH"),
        offlineCreatedAt: z.string().datetime({ message: "offlineCreatedAt must be a valid timestamp." })
      })
    ).min(0, { message: "Sync batch array can be empty." })
  })
});
