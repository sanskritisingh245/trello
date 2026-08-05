import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
      });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.id = decoded.id;
    next();
  } catch (e: any) {
    return res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
    });
  }
};
