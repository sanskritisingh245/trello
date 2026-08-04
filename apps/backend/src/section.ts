import express ,{type Response , type Request  } from "express";
import {  SectionSchema, SectionUpdateSchema} from "../zod";
import { prisma } from "db/client";

import { authMiddleware } from "../HELPER/authMiddleware";


const app = express();
app.use(express.json())

app.post("/api/v1/section", authMiddleware , async (req:Request, res:Response)=>{
    try{
        const {success , data} = SectionSchema.safeParse(req.body);
        if (!success){
            return res.status(400).json({
                success:false,
                error:"INVALID_REQUEST"
            })
        }
    
        const userId=req.id;
        const membership = await prisma.membership.findUnique({
            where:{
                userId:userId,
            }
        })
        const role = membership?.role;
    
        if (role != "admin"){
            return res.status(400).json({
                success:false,
                error:"NOT_AUTHENTICATED_TO_CREATE_ORG"
            })
        }
    
        const section =await prisma.section.create({
            data:{
                title:data.title,
                boardId:data.boardId
            }
        })
    
        return res.status(200).json({
            success:true,
            data:section
        })
    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }

})

app.put("/api/v1/section/:sectionId", authMiddleware , async  (req:Request, res:Response)=>{
    try{
        const {success , data} = SectionUpdateSchema.safeParse(req.body);
        if (!success){
            return res.status(400).json({
                success:false,
                error:"INVALID_REQUEST"
            })
        }
    
        const sectionId = req.params.sectionId as string;
        if(!sectionId){
            return res.status(400).json({
                success:false,
                error:"PLEASE_PROVIDE_SECTION_ID"
            })
        }
        const userId=req.id;
        const membership = await prisma.membership.findUnique({
            where:{
                userId:userId,
            }
        })
        const role = membership?.role;
    
        if (role != "admin"){
            return res.status(400).json({
                success:false,
                error:"NOT_AUTHENTICATED_TO_CREATE_ORG"
            })
        }

        const section = await prisma.section.update({
            where:{
                id:sectionId
            },data:{
                title:data.title
            }
        })

        return res.status(200).json({
            success:true,
            data:section
        })

    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }

})

app.get("/api/v1/section", authMiddleware , async (req:Request, res:Response)=>{
    try{
        const userId=req.id;
        const membership = await prisma.membership.findUnique({
            where:{
                userId:userId,
            },
        })
        const role = membership?.role;
    
        if (role != "admin"){
            return res.status(400).json({
                success:false,
                error:"NOT_AUTHENTICATED_TO_CREATE_ORG"
            })
        }
        const orgId = membership?.orgId
        const boards = await prisma.boards.findMany({
            where:{
                orgId
            },
            include:{
                section:true
            }
        })

        return res.status(200).json({
            success:true,
            data:boards
        })
    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
})

app.delete("/api/v1/section/:sectionId", authMiddleware , async (req:Request , res:Response)=>{
    try{
        const userId=req.id;
        const membership = await prisma.membership.findUnique({
            where:{
                userId:userId,
            },
        })
        const role = membership?.role;
    
        if (role != "admin"){
            return res.status(400).json({
                success:false,
                error:"NOT_AUTHENTICATED_TO_CREATE_ORG"
            })
        }

        const sectionId= req.params.sectionId as string;
        if(!sectionId){
            return res.status(400).json({
                success:false,
                error:"PLEASE_PROVIDE_SECTION_ID"
            })
        }

        await prisma.section.delete({
            where:{
                id:sectionId
            }
        })

        return res.status(200).json({
            success:true,
            msg:"SECTION_SUCCESSFULLY_DELETED"
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