// Purpose: lets you write async controllers without wrapping them in try-catch each time.
// Example usage later:
//router.post("/login", asyncHandler(authController.login));


import { Request, Response, NextFunction } from "express";

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

// Utility to wrap async functions to catch errors automatically
export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
