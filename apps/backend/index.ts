import express ,{type Response , type Request  } from "express";
import { OrgSchema, SignupSchema } from "./zod";
import { prisma } from "db/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {authMiddleware} from "./authMiddleware"
import { da, fa } from "zod/locales";


const JWT_SECRET=process.env.JWT_SECRET||"";

const app = express();
app.use(express.json())

app.post("/singup", async (req:Request, res:Response)=>{
    try{
        const {success , data} = SignupSchema.safeParse(req.body);
        if (!success){
            return res.status(400).json({
                success:false,
                error:"INVALID_REQUEST"
            })
        }
        const exsistingUser = await prisma.user.findUnique({
            where:{
                email:data.email
            }
        })

        if(exsistingUser){
            return res.status(400).json({
                success:false,
                error:"user already exsist please signin"
            })
        }

        const hash = await bcrypt.hash(data.password , 10);
        const user = await prisma.user.create({
            data:{
                email:data.email,
                password:hash
            }
        })
        return res.status(200).json({
            success:true,
            msg:"SUCCESSFULLY_SIGNEDUP"
        })

    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
})

app.post("/signing", async (req: Request, res:Response)=>{
     try{
        const {success , data} = SignupSchema.safeParse(req.body);
        if (!success){
            return res.status(400).json({
                success:false,
                error:"INVALID_REQUEST"
            })
        }
        const exsistingUser = await prisma.user.findUnique({
            where:{
                email:data.email
            }
        })

        if(!exsistingUser){
            return res.status(400).json({
                success:false,
                error:"USER_NOT_FOUND_PLEASE_SINGUP"
            })
        }

        const password =await bcrypt.compare(data.password , exsistingUser.password)
        if(! password) {
            return res.status(400).json({
                success:false,
                error:"INCORRECT_PASSWORD"
            })
        }
        const token = jwt.sign({
            id:exsistingUser.id,
            email:exsistingUser.email
        },JWT_SECRET)

        return res.status(200).json({
            success:true,
            data:token,
            msg:"USER_SUCCESSFULLY_SIGNEDIN"
        })

    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
})

app.post("/create_org",authMiddleware, async (req:Request, res:Response)=>{
    try{
        const {success , data}= OrgSchema.safeParse(req.body);
        if (!success){
            return res.status(400).json({
                success:false,
                error:"INVALID_REQUEST"
            })
        }
        const userId=req.id;

        const membership = await prisma.membership.findUnique({
            where:{
                userId:userId
            }
        })
        const role = membership?.role;

        if (role != "admin"){
            return res.status(400).json({
                success:false,
                error:"NOT_AUTHENTICATED_TO_CREATE_ORG"
            })
        }

        const org = await prisma.organization.create({
            data:{
                name:data.name,
                description:data.description
            }
        })

        return res.status(200).json({
            success:true,
            msg:"ORG_SUCCESSFULLY_CREATED"
        })

    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
})

app

app.listen(3000, ()=>{
    console.log("running on port 3000")
})

