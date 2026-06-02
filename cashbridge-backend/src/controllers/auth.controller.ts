import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  /**
   * Endpoint routing for Merchant Registration
   */
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.registerMerchant(req.body);
      
      // Set secure refresh token inside cookies as robust backend standard
      res.cookie("cookieRefreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days matching token lifespan
      });

      return res.status(201).json({
        status: "success",
        message: "Merchant account registered successfully.",
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken // Kept for offline client backups
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint routing for Merchant Authorizations
   */
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.loginMerchant(email, password);

      // Store refresh Token inside system cookie
      res.cookie("cookieRefreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        status: "success",
        message: "Merchant authorization successful.",
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint refreshing expired merchant key sessions
   */
  public static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Fetch refresh parameter from payload or falling back cleanly to cookies
      const refreshToken = req.body.refreshToken || req.cookies?.cookieRefreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          status: "fail",
          error: "Authorization refresh blocked. Missing refresh session token."
        });
      }

      const tokens = await AuthService.refreshMerchantSession(refreshToken);

      res.cookie("cookieRefreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        status: "success",
        message: "Session authorization successfully validated and renewed.",
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles Logging Out & Clearances
   */
  public static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Clean target authorization cookies
      res.clearCookie("cookieRefreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      });

      return res.status(200).json({
        status: "success",
        message: "Logged out successfully from CashBridge API Gateway."
      });
    } catch (error) {
      next(error);
    }
  }
}
