import express ,{type Response , type Request  } from "express";
import {  CommentsSchema} from "../zod";
import { prisma } from "db/client";

import { authMiddleware } from "../HELPER/authMiddleware";


const app = express();
app.use(express.json())

app.post("/api/v1/comment/:issueId", authMiddleware , async(req:Request, res:Response)=>{
    try{
        const {success , data}= CommentsSchema.safeParse(req.body);
        if (!success){
            return res.status(400).json({
                success:false,
                error:"INVALID_DATA"
            })
        }
        const userId = req.id;
        const issueId = req.params.issueId as string;

        const issue = await prisma.issue.findFirst({
            where: {
                id: issueId,
                board: {
                    organization: {
                        membership: {
                            some: {
                                userId,
                            },
                        },
                    },
                },
            },
        });

        if (!issue) {
            return res.status(403).json({
                message: "Not authorized",
            });
        }

        await prisma.comments.create({
            data:{
                issueId:issueId,
                comment:data.comment
            }
        })


    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
})

app.put("/api/v1/comment/:commentId", authMiddleware, async(req:Request, res:Response)=>{
    try{
         const {success , data}= CommentsSchema.safeParse(req.body);
        if (!success){
            return res.status(400).json({
                success:false,
                error:"INVALID_DATA"
            })
        }
        const userId = req.id;
        const commentId = req.params.issueId as string;

        const comment = await prisma.comments.findFirst({
            where: {
                id: commentId,
                issue:{
                    board: {
                        organization: {
                            membership: {
                                some: {
                                    userId,
                                },
                            },
                        },
                    },
                }
            },
        });

        if (!comment) {
            return res.status(403).json({
                message: "Not authorized",
            });
        }

        const comments= await prisma.comments.update({
            where:{
               id:commentId
            },data:{
                comment:data.comment
            }
        })

        return res.status(200).json({
            success:true,
            data:comments
        })


    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
}) 

app.get("/api/v1/comment/:issueId", authMiddleware, async(req:Request, res:Response)=>{
    try{
         const userId = req.id;
        const issueId = req.params.issueId as string;

        const issue = await prisma.issue.findFirst({
            where: {
                id: issueId,
                board: {
                    organization: {
                        membership: {
                            some: {
                                userId,
                            },
                        },
                    },
                },
            },
            include:{
                comments:true
            }
        });

        if (!issue) {
            return res.status(403).json({
                message: "Not authorized",
            });
        }

        return res.status(200).json({
            success:true,
            data:issue.comments
        })
   
    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
})

app.delete("/api/v1/comment/:commentId", authMiddleware, async(req:Request, res:Response)=>{
    try{
        const userId = req.id;
        const commentId = req.params.issueId as string;

        const comment = await prisma.comments.findFirst({
            where: {
                id: commentId,
                issue:{
                    board: {
                        organization: {
                            membership: {
                                some: {
                                    userId,
                                },
                            },
                        },
                    },
                }
            },
        });

        if (!comment) {
            return res.status(403).json({
                message: "Not authorized",
            });
        }

        await prisma.comments.delete({
            where:{
                id:commentId
            }
        })

        return res.status(200).json({
            success:true,
            msg:"COMMENT_SUCCESSFULLY_DELETED"
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