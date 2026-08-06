import express, { type Response, type Request } from "express";
import { CommentsSchema } from "../zod";
import { prisma } from "db/client";

import { authMiddleware } from "../helper/authMiddleware";

const router = express.Router();

router.post(
  "/api/v1/comment/:issueId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { success, data } = CommentsSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "INVALID_DATA",
      });
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
        success: false,
        error: "UNAUTHORIZED",
      });
    }

    const comment = await prisma.comments.create({
      data: {
        issueId: issueId,
        comment: data.comment,
      },
    });

    return res.status(200).json({
      success: true,
      data: comment,
    });
  },
);

router.put(
  "/api/v1/comment/:commentId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { success, data } = CommentsSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "INVALID_DATA",
      });
    }
    const userId = req.id;
    const commentId = req.params.commentId as string;

    const comment = await prisma.comments.findFirst({
      where: {
        id: commentId,
        issue: {
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
      },
    });

    if (!comment) {
      return res.status(403).json({
        success: false,
        error: "UNAUTHORIZED",
      });
    }

    const comments = await prisma.comments.update({
      where: {
        id: commentId,
      },
      data: {
        comment: data.comment,
      },
    });

    return res.status(200).json({
      success: true,
      data: comments,
    });
  },
);

router.get(
  "/api/v1/comment/:issueId",
  authMiddleware,
  async (req: Request, res: Response) => {
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
      include: {
        comments: true,
      },
    });

    if (!issue) {
      return res.status(403).json({
        success: false,
        error: "UNAUTHORIZED",
      });
    }

    return res.status(200).json({
      success: true,
      data: issue.comments,
    });
  },
);

router.delete(
  "/api/v1/comment/:commentId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.id;
    const commentId = req.params.commentId as string;

    const comment = await prisma.comments.findFirst({
      where: {
        id: commentId,
        issue: {
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
      },
    });

    if (!comment) {
      return res.status(403).json({
        success: false,
        error: "UNAUTHORIZED",
      });
    }

    await prisma.comments.delete({
      where: {
        id: commentId,
      },
    });

    return res.status(200).json({
      success: true,
      msg: "COMMENT_SUCCESSFULLY_DELETED",
    });
  },
);

export default router;
