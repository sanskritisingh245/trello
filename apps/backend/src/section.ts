import express, { type Response, type Request } from "express";
import { SectionSchema, SectionUpdateSchema } from "../zod";
import { prisma } from "db/client";

import { authMiddleware } from "../helper/authMiddleware";
import { hasRole } from "../helper/hasRole";

const router = express.Router();

router.post(
  "/api/v1/section",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { success, data } = SectionSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "INVALID_REQUEST",
      });
    }

    const userId = req.id;

    const board = await prisma.boards.findUnique({
      where: {
        id: data.boardId,
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

    const section = await prisma.section.create({
      data: {
        title: data.title,
        boardId: data.boardId,
      },
    });

    return res.status(200).json({
      success: true,
      data: section,
    });
  },
);

router.put(
  "/api/v1/section/:sectionId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { success, data } = SectionUpdateSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "INVALID_REQUEST",
      });
    }

    const sectionId = req.params.sectionId as string;
    if (!sectionId) {
      return res.status(400).json({
        success: false,
        error: "PLEASE_PROVIDE_SECTION_ID",
      });
    }
    const userId = req.id;

    const existingSection = await prisma.section.findUnique({
      where: {
        id: sectionId,
      },
      include: {
        board: true,
      },
    });
    if (!existingSection) {
      return res.status(404).json({
        success: false,
        error: "SECTION_NOT_FOUND",
      });
    }

    if (!(await hasRole(userId, existingSection.board.orgId, "admin"))) {
      return res.status(400).json({
        success: false,
        error: "NOT_AUTHENTICATED_TO_CREATE_ORG",
      });
    }

    const section = await prisma.section.update({
      where: {
        id: sectionId,
      },
      data: {
        title: data.title,
      },
    });

    return res.status(200).json({
      success: true,
      data: section,
    });
  },
);

router.get(
  "/api/v1/section",
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

    if (!(await hasRole(userId, orgId, "admin"))) {
      return res.status(400).json({
        success: false,
        error: "NOT_AUTHENTICATED_TO_CREATE_ORG",
      });
    }
    const boards = await prisma.boards.findMany({
      where: {
        orgId,
      },
      include: {
        section: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: boards,
    });
  },
);

router.delete(
  "/api/v1/section/:sectionId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.id;

    const sectionId = req.params.sectionId as string;
    if (!sectionId) {
      return res.status(400).json({
        success: false,
        error: "PLEASE_PROVIDE_SECTION_ID",
      });
    }

    const existingSection = await prisma.section.findUnique({
      where: {
        id: sectionId,
      },
      include: {
        board: true,
      },
    });
    if (!existingSection) {
      return res.status(404).json({
        success: false,
        error: "SECTION_NOT_FOUND",
      });
    }

    if (!(await hasRole(userId, existingSection.board.orgId, "admin"))) {
      return res.status(400).json({
        success: false,
        error: "NOT_AUTHENTICATED_TO_CREATE_ORG",
      });
    }

    await prisma.section.delete({
      where: {
        id: sectionId,
      },
    });

    return res.status(200).json({
      success: true,
      msg: "SECTION_SUCCESSFULLY_DELETED",
    });
  },
);

export default router;
