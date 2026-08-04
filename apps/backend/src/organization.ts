import express ,{type Response , type Request  } from "express";
import {  OrgSchema, updateOrgSchema } from "../zod";
import { prisma } from "db/client";

import { authMiddleware } from "../HELPER/authMiddleware";


const app = express();
app.use(express.json())

app.post("/api/v1/organization/create",authMiddleware, async (req:Request, res:Response)=>{
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

app.put("/api/v1/organization/update", authMiddleware, async (req:Request,res:Response )=>{
    try{
        const {success, data} = updateOrgSchema.safeParse(req.body);
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
        prisma.organization.update({
            where:{
                id:membership?.orgId
            },data:{
                name:data.name,
                description:data.description
            }
        })
        

    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
})

app.get("/api/v1/organization", authMiddleware, async(req:Request, res:Response)=>{
    try{
        const userId= req.id;
        const membership = await prisma.membership.findMany({
            where:{
                userId:userId
            },
            include: {
                organization: true
            }
        })

        return res.status(200).json({
            success:true,
            data:{
               membership
            }
        })

    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
    
})

app.get("/api/v1/organization/:orgId", authMiddleware, async(req:Request, res:Response)=>{
    try{
        const orgId= req.params.orgId as string;
        if(!orgId){
            return res.status(400).json({
                success:false,
                error:"PLEASE_PROVIDE_ORGID"
            })
        }
        const userId= req.id;

        const membership= await prisma.membership.findUnique({
            where:{
                userId:userId,
                orgId:orgId
            },
            include: {
                organization: true
            }
        })

        return res.status(200).json({
            success:true,
            data:{membership}
        })

    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
})

app.delete("/api/v1/organization/:orgId", authMiddleware , async(req:Request, res:Response)=>{
    try{
        const orgId= req.params.orgId as string;
        if(!orgId){
            return res.status(400).json({
                success:false,
                error:"PLEASE_PROVIDE_ORGID"
            })
        }
        const userId= req.id;
        const membership = await prisma.membership.findUnique({
            where:{
                userId:userId,
                orgId:orgId
            }
        })
        const role = membership?.role;

        if (role != "admin"){
            return res.status(400).json({
                success:false,
                error:"NOT_AUTHENTICATED_TO_CREATE_ORG"
            })
        }

        prisma.organization.delete({
            where:{id:orgId}
        })

        return res.status(200).json({
            success:true,
            msg:"ORGANIZATION_DELETED_SUCCESSFULLY"
        })
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

