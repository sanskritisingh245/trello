import express, { type Response, type Request } from "express";
import { BoardSchema, BoardUpdateSchema } from "../zod";
import { prisma } from "db/client";

import { authMiddleware } from "../helper/authMiddleware";
import { hasRole } from "../helper/hasRole";

const router = express.Router();

router.get(
  "/api/v1/boards",
  authMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.id;
    const orgId = req.query.orgId as string;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: "PLEASE_PROVIDE_ORGID",
      });
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        orgId: orgId,
      },
    });
    if (!membership) {
      return res.status(403).json({
        success: false,
        error: "UNAUTHORIZED",
      });
    }

    const board = await prisma.boards.findMany({
      where: {
        orgId: orgId,
      },
    });

    return res.status(200).json({
      success: true,
      data: { board },
    });
  },
);

router.post(
  "/api/v1/boards",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { success, data } = BoardSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "INVALID_DATA",
      });
    }
    const userId = req.id;

    if (!(await hasRole(userId, data.orgId, "admin"))) {
      return res.status(400).json({
        success: false,
        error: "NOT_AUTHENTICATED_TO_CREATE_ORG",
      });
    }

    const board = await prisma.boards.create({
      data: {
        title: data.title,
        orgId: data.orgId,
      },
    });

    return res.status(200).json({
      success: true,
      data: board,
    });
  },
);

router.delete(
  "/api/v1/boards/:boardId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;
    if (!boardId) {
      return res.status(400).json({
        success: false,
        error: "PLEASE_PROVIDE_BOARD_ID",
      });
    }

    const userId = req.id;

    const board = await prisma.boards.findUnique({
      where: {
        id: boardId,
      },
    });
    if (!board) {
      return res.status(404).json({
        success: false,
        error: "BOARD_NOT_FOUND",
      });
    }

    if (!(await hasRole(userId, board.orgId, "admin"))) {
      return res.status(400).json({
        success: false,
        error: "NOT_AUTHENTICATED_TO_CREATE_ORG",
      });
    }

    await prisma.boards.delete({
      where: {
        id: boardId,
      },
    });

    return res.status(200).json({
      success: true,
      msg: "SUCCESSFULLY_DELETED",
    });
  },
);

router.put(
  "/api/v1/boards/:boardId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;
    const { success, data } = BoardUpdateSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "INVALID_DATA",
      });
    }

    const userId = req.id;

    const board = await prisma.boards.findUnique({
      where: {
        id: boardId,
      },
    });
    if (!board) {
      return res.status(404).json({
        success: false,
        error: "BOARD_NOT_FOUND",
      });
    }

    if (!(await hasRole(userId, board.orgId, "admin"))) {
      return res.status(400).json({
        success: false,
        error: "NOT_AUTHENTICATED_TO_CREATE_ORG",
      });
    }

    const updatedBoard = await prisma.boards.update({
      where: {
        id: boardId,
      },
      data: {
        title: data.title,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedBoard,
    });
  },
);

export default router;
