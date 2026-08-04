import express ,{type Response , type Request  } from "express";
import {  IssueSchema, UpdateIssueSchema} from "../zod";
import { prisma } from "db/client";

import { authMiddleware } from "../HELPER/authMiddleware";


const app = express();
app.use(express.json())

app.post("/api/v1/issue/:sectionId", authMiddleware, async (req:Request, res:Response)=>{
    try{
        const userId= req.id;
        const sectionId= req.params.sectionId as string;

        const section = await prisma.section.findFirst({
            where:{
                id:sectionId,
                board:{
                    organization:{
                        membership:{
                            some:{
                                userId,
                            },
                        },
                    },
                },
            },
            select:{
                id:true,
                boardId:true
            }
        })

        if(!section){
            return res.status(403).json({
                success:false,
                error:"UNAUTHOIZED"
            })
        }

        const {success , data}= IssueSchema.safeParse(req.id);
        if (!success){
            return res.status(400).json({
                success:false,
                error:"INVALID_REQUEST"
            })
        }

        const issue= await prisma.issue.create({
            data:{
                title:data.title,
                description:data.description,
                sectionId:section.id,
               boardId:section.boardId
            }
        })

        return res.status(200).json({
            success:true,
            data:issue
        })


    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
}) 

app.get("/api/v1/issue/:sectionId", authMiddleware, async (req:Request, res:Response)=>{
    try{
        const userId= req.id;
        const sectionId= req.params.sectionId as string;

        const section = await prisma.section.findFirst({
            where:{
                id:sectionId,
                board:{
                    organization:{
                        membership:{
                            some:{
                                userId,
                            },
                        },
                    },
                },
            },
            select:{
                id:true,
                issue:true
            }
        })

        if(!section){
            return res.status(403).json({
                success:false,
                error:"UNAUTHOIZED"
            })
        }

        return res.status(200).json({
            success:true,
            data:section.issue
        })


    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
}) 

app.put("/api/v1/issue/:issueId", authMiddleware, async (req:Request, res:Response)=>{
    try{
        const userId=req.id;
        const issueId= req.params.issueId as string;

        const{success , data}= UpdateIssueSchema.safeParse(req.body);
        if (!success){
            return res.status(400).json({
                success:false,
                error:"INVALID_REQUEST"
            })
        }

        const issue = await prisma.issue.update({
            where:{
                id:issueId,
                section:{
                    board:{
                        organization:{
                            membership:{
                                some:{
                                    userId,
                                },
                            },
                        },
                    },
                },
            },
            data:{
                title:data.title,
                description:data.description

            }
        })

        if(!issue){
            return res.status(403).json({
                success:false,
                error:"UNAUTHOIZED"
            })
        }


        return res.status(200).json({
            success:true,
            data:issue
        })

    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
}) 

app.get("/api/v1/issue/:issueId", authMiddleware, async (req:Request, res:Response)=>{
    try{
        const userId=req.id;
        const issueId= req.params.issueId as string;

        const issue = await prisma.issue.findFirst({
            where:{
                id:issueId,
                section:{
                    board:{
                        organization:{
                            membership:{
                                some:{
                                    userId,
                                },
                            },
                        },
                    },
                },
            }
        })

        if(!issue){
            return res.status(403).json({
                success:false,
                error:"UNAUTHOIZED"
            })
        }

        return res.status(200).json({
            success:true,
            data:issue
        })

    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
}) 

app.delete("/api/v1/issue/:issueId", authMiddleware, async (req:Request, res:Response)=>{
    try{
        const userId=req.id;
        const issueId= req.params.issueId as string;

        const issue = await prisma.issue.delete({
            where:{
                id:issueId,
                section:{
                    board:{
                        organization:{
                            membership:{
                                some:{
                                    userId,
                                },
                            },
                        },
                    },
                },
            }
        })
        if(!issue){
            return res.status(403).json({
                success:false,
                error:"UNAUTHOIZED"
            })
        }


        return res.status(200).json({
            success:true,
            msg:"DELETED_SUCCESSFULLY"
        })

    }catch(e:any){
        return res.status(500).json({
        success: false,
        msg: e.message || "Internal Server Error",
      });
    }
}) 

app.put("/api/v1/issue/move:/issueId/:sectionId", authMiddleware, async (req:Request, res:Response)=>{
    try{
        const userId=req.id;
        const issueId= req.params.issueId as string;
        const newSectionId= req.params.sectionId as string

        const issue = await prisma.issue.delete({
            where:{
                id:issueId,
                    board:{
                        organization:{
                            membership:{
                                some:{
                                    userId,
                                },
                            },
                        },
                    },
            },
            select:{
                id:true,
                boardId:true
            }
        })

        if(!issue){
            return res.status(403).json({
                success:false,
                error:"UNAUTHOIZED"
            })
        }

        const section = await prisma.section.findFirst({
            where:{
                id:newSectionId,
                boardId:issue.boardId
            },
        })

        if(!section){
            return res.status(404).json({
                success:false,
                error:"SECTION_NOT_FOUND"
            })
        }

        const updatedIssue = await prisma.issue.update({
            where:{
                id:issueId
            },
            data:{
                sectionId:newSectionId
            }
        })

        return res.status(200).json({
            success:true,
            data:updatedIssue
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