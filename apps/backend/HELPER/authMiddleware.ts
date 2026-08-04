import type {  Request,  Response ,NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_SECRET=process.env.JWT_SECRET||"";

declare global {
    namespace Express {
        interface Request {
            id: string
        }
    }
}

export const authMiddleware=(req:Request, res:Response, next:NextFunction)=>{
    try{
        const token= req.headers.authorization;
        if(!token){
            return res.status(404).json({
                success:false,
                error:"token not found ehhh"
            })
        }
        const decoded= jwt.verify(token,JWT_SECRET) as JwtPayload;
        if(!decoded){
            return res.status(500).json({
                success:false,
                error:"UNAUTHORIZED"
            })
        }
        req.id=decoded.id;
        next();
    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
}