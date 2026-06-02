import { Request, Response, NextFunction } from "express";
import { BusinessService } from "../services/business.service";

export class BusinessController {
  /**
   * Controller recording active bookkeeping entries (sales, MoMo, cash mutations)
   */
  public static async createTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access blocked." });
      }

      const tx = await BusinessService.createTransaction(userId, req.body);
      return res.status(201).json({
        status: "success",
        message: "Ledger transaction recorded successfully.",
        data: tx
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller spawning new local traders or client profiles
   */
  public static async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access blocked." });
      }

      const customer = await BusinessService.createCustomer(userId, req.body);
      return res.status(201).json({
        status: "success",
        message: "Customer record created successfully.",
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lists customer contact boards linked to merchants
   */
  public static async listCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access blocked." });
      }

      const customers = await BusinessService.listCustomers(userId);
      return res.status(200).json({
        status: "success",
        data: customers
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller capturing initial merchant debt allocations
   */
  public static async createDebt(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access blocked." });
      }

      const debt = await BusinessService.createDebt(userId, req.body);
      return res.status(201).json({
        status: "success",
        message: "Customer debt file successfully created.",
        data: debt
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller writing payments made against outstanding debt structures
   */
  public static async recordRepayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { debtId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access blocked." });
      }

      const updatedDebt = await BusinessService.recordRepayment(userId, debtId, req.body);
      return res.status(200).json({
        status: "success",
        message: "Repayment captured successfully and ledger balance balanced.",
        data: updatedDebt
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lists a paginated trace sheet of past cash and mobile money journals
   */
  public static async getTransactionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access blocked." });
      }

      // Read filter constraints
      const filters = {
        category: req.query.category as string || undefined,
        paymentMethod: req.query.paymentMethod as string || undefined,
        startDate: req.query.startDate as string || undefined,
        endDate: req.query.endDate as string || undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };

      const result = await BusinessService.getTransactionHistory(userId, filters);
      return res.status(200).json({
        status: "success",
        data: result.transactions,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller aggregating total sales metrics and active financial stats
   */
  public static async getAnalyticsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized access blocked." });
      }

      const summary = await BusinessService.getAnalyticsSummary(userId);
      return res.status(200).json({
        status: "success",
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }
}
