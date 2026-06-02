import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { AppError } from "./error.middleware";

/**
 * Middleware factory validating incoming requests against Zod schemas
 */
export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Re-assign parsed inputs back to express request channels safely
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Collect Zod failures cleanly formatted in a structured display index
        const validationProblems = error.errors.map((err) => ({
          field: err.path.join("."),
          issue: err.message,
        }));
        
        return next(
          new AppError(
            `Credentials validation failed: ${validationProblems.map(p => p.issue).join(" ")}`,
            400
          )
        );
      }
      next(error);
    }
  };
};
