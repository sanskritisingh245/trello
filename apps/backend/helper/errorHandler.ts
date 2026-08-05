import type { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);
  return res.status(500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR",
  });
};
