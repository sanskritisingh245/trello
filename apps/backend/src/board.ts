import express ,{type Response , type Request  } from "express";
import { BoardSchema} from "../zod";
import { prisma } from "db/client";

import { authMiddleware } from "../HELPER/authMiddleware";

const app = express();
app.use(express.json())


app.get("/api/v1/boards", authMiddleware , async (req:Request, res:Response)=>{
    try{
        const userId=req.id;
        const org= await prisma.membership.findUnique({
            where:{
                userId:userId
            }
        })
        const board= await prisma.boards.findMany({
            where:{
                orgId:org?.id
            }
        })

        return res.status(200).json({
            success:true,
            data:{board}
        })
        
    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
})


app.post("/api/v1/boards", authMiddleware, async (req:Request, res:Response)=>{
    try{
         const {success, data}= BoardSchema.safeParse(req.body);
        if(!success){
            return res.status(400).json({
                success:false,
                error:"INVALID_DATA"
            })
        }
        const userId= req.id;

        const is_admin= await prisma.membership.findUnique({
            where:{
                userId:userId
            }
        })
        if (is_admin){



        }
        
    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
})

app.delete("/api/v1/boards/:boardId", authMiddleware , async(req:Request, res:Response)=>{
    try{
        const boardId= req.params.boardId as string;
        if (!boardId){
            return res.status(200).json({
                success:false,
                error:"PLEASE_PROVIDE_BOARD_ID"
            })
        }

        const userId= req.id;
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

        prisma.boards.delete({
            where:{
                id:boardId
            }
        })

        return res.status(200).json({
            success:true,
            msg:"SUCCESSFULLY_DELETED"
        })

    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
})

app.put("/api/v1/boards/:boardId", authMiddleware, async (req:Request, res:Response)=>{
    try{
        const boardId= req.params.boardId as string;
        const userId= req.id;
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

        const board = await prisma.boards.delete({
            where:{
                id:boardId
            }
        })
        return res.status(200).json({
            success:true,
            msg:"SUCCESSFULLY_DELETED"
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