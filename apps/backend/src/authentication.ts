import express ,{type Response , type Request  } from "express";
import {  SignupSchema } from "../zod";
import { prisma } from "db/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../HELPER/authMiddleware";

const JWT_SECRET=process.env.JWT_SECRET||"";

const app = express();
app.use(express.json())

app.post("/api/v1/singup", async (req:Request, res:Response)=>{
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
                password:hash,
                profilePhoto:data.profile,
                description:data.description
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

app.post("/api/v1/singin", async (req: Request, res:Response)=>{
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

app.get("/api/v1/user/me", authMiddleware, async (req:Request, res:Response)=>{
    try{
        const userId = req.id;
        const user = await prisma.user.findUnique({
            where:{
                id:userId
            }
        })
        return res.status(200).json({
            success:true,
            data:{
                email:user?.email,
                profile:user?.profilePhoto,
                description:user?.description
            }
        })  
    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
})

app.get("/api/v1/user/:userId", authMiddleware , async (req:Request, res:Response)=>{
    try{
        const userId=req.id;
        const profileId= req.params.userId as string;
        if(!profileId){
            return res.status(400).json({
                success:false,
                error:"PLEASE_PROVIDE_USERID"
            })
        }
        const user= await prisma.user.findUnique({
            where:{
                id:profileId
            },
            include: {
                membership:true
            },
            omit: {
                password: true
            }
        })
        if(!user){
            return res.status(404).json({
                success:false,
                error:"USER_NOT_FOUND"
            })
        }
        const membership= await prisma.membership.findUnique({
            where:{
                userId:userId
            }
        })
        const user_membership= await prisma.membership.findUnique({
            where:{
                userId:profileId
            }
        })
        if (membership?.orgId === user_membership?.orgId){
            return res.status(200).json({
                success:true,
                data:{
                    email:user.email,
                    profile:user.profilePhoto,
                    description:user.description
                }
            })
        }

    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
})

app.listen(3000, ()=>{
    console.log("running on port 3000")
})