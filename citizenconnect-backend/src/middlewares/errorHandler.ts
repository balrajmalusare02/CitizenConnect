//Purpose: catches all errors and sends a neat JSON response like:
/* {
"success": false,  
"message": "Invalid credentials"
} */


import { Request, Response, NextFunction } from "express";

// Custom error interface (optional)
interface CustomError extends Error {
  statusCode?: number;
}

// Global Error Handler
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error 💥:", err.message);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
