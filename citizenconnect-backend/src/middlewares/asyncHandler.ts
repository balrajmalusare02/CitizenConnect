// Purpose: lets you write async controllers without wrapping them in try-catch each time.
// Example usage later:
//router.post("/login", asyncHandler(authController.login));

import { Request, Response, NextFunction } from "express";

type AsyncFunction<T extends Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<any>;

// Utility to wrap async functions to catch errors automatically
export const asyncHandler = <T extends Request>(fn: AsyncFunction<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
