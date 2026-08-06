import express, { type Response, type Request } from "express";
import { OrgSchema, updateOrgSchema } from "../zod";
import { prisma } from "db/client";

import { authMiddleware } from "../helper/authMiddleware";
import { hasRole } from "../helper/hasRole";

const router = express.Router();

router.post(
  "/api/v1/organization/create",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { success, data } = OrgSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "INVALID_REQUEST",
      });
    }
    const userId = req.id;

    const org = await prisma.organization.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });

    await prisma.membership.create({
      data: {
        userId: userId,
        orgId: org.id,
        role: "admin",
      },
    });

    return res.status(200).json({
      success: true,
      data: org,
      msg: "ORG_SUCCESSFULLY_CREATED",
    });
  },
);

router.put(
  "/api/v1/organization/:orgId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { success, data } = updateOrgSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "INVALID_REQUEST",
      });
    }

    const orgId = req.params.orgId as string;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: "PLEASE_PROVIDE_ORGID",
      });
    }

    const userId = req.id;

    if (!(await hasRole(userId, orgId, "admin"))) {
      return res.status(400).json({
        success: false,
        error: "NOT_AUTHENTICATED_TO_CREATE_ORG",
      });
    }
    const org = await prisma.organization.update({
      where: {
        id: orgId,
      },
      data: {
        name: data.name,
        description: data.description,
      },
    });

    return res.status(200).json({
      success: true,
      data: org,
    });
  },
);

router.get(
  "/api/v1/organization",
  authMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.id;
    const membership = await prisma.membership.findMany({
      where: {
        userId: userId,
      },
      include: {
        organization: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        membership,
      },
    });
  },
);

router.get(
  "/api/v1/organization/:orgId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const orgId = req.params.orgId as string;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: "PLEASE_PROVIDE_ORGID",
      });
    }
    const userId = req.id;

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        orgId: orgId,
      },
      include: {
        organization: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: { membership },
    });
  },
);

router.delete(
  "/api/v1/organization/:orgId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const orgId = req.params.orgId as string;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: "PLEASE_PROVIDE_ORGID",
      });
    }
    const userId = req.id;

    if (!(await hasRole(userId, orgId, "admin"))) {
      return res.status(400).json({
        success: false,
        error: "NOT_AUTHENTICATED_TO_CREATE_ORG",
      });
    }

    await prisma.organization.delete({
      where: { id: orgId },
    });

    return res.status(200).json({
      success: true,
      msg: "ORGANIZATION_DELETED_SUCCESSFULLY",
    });
  },
);

export default router;
