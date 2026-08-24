import express, { type Response, type Request } from "express";
import { MembershipSchema } from "../zod";
import { prisma } from "db/client";

import { authMiddleware } from "../helper/authMiddleware";
import { hasRole } from "../helper/hasRole";
import { sendInviteEmail } from "../helper/email";
import { da } from "zod/locales";

const router = express.Router();

router.post(
  "/api/v1/invite",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { success, data } = MembershipSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "INVALID_DATA",
      });
    }

    const adminId = req.id;

    if (!(await hasRole(adminId, data.orgId, "admin"))) {
      return res.status(403).json({
        success: false,
        error: "UNAUTHORIZED",
      });
    }

    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: data.email,
        orgId: data.orgId,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        error: "INVITATION_ALREADY_SENT",
      });
    }

    const invitation = await prisma.invitation.create({
      data:{
        email:data.email,
        orgId:data.orgId,
        invitedBy:adminId,
        role:"member"
      },
    });

    const org = await prisma.organization.findUnique({
      where:{
        id:data.orgId
      }
    })
    sendInviteEmail(data.email , org?.name ?? "an organization", invitation.id);

    return res.status(200).json({
      success: true,
      msg: "INVITATION_SENT",
    });
  },
);

router.post(
  "/api/v1/accept/:inviteId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.id;
    const inviteId = req.params.inviteId as string;

    const invite = await prisma.invitation.findUnique({
      where: {
        id: inviteId,
      },
    });
    if (!invite) {
      return res.status(404).json({
        success: false,
        error: "INVITATION_NOT_FOUND",
      });
    }

    if (invite.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        error: "INVITATION_ACCEPTED_OR_DECLINED",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (user?.email !== invite.email) {
      return res.status(403).json({
        success: false,
        error: "INVITATION_NOT_FOUND",
      });
    }

    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId,
        orgId: invite.orgId,
      },
    });
    if (existingMembership) {
      return res.status(400).json({
        success: false,
        error: "ALREADY_ADDED",
      });
    }
    await prisma.membership.create({
      data: {
        userId: userId,
        orgId: invite.orgId,
        role: invite.role,
      },
    });
    await prisma.invitation.update({
      where: {
        id: invite.id,
      },
      data: {
        status: "ACCEPTED",
      },
    });

    return res.status(200).json({
      success: true,
      msg: "INVITATION_ACCEPTED.",
    });
  },
);

router.get(
  "/api/v1/membership/:orgId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const adminId = req.id;
    const orgId = req.params.orgId as string;

    if (!(await hasRole(adminId, orgId, "admin"))) {
      return res.status(403).json({
        success: false,
        error: "UNAUTHORIZED",
      });
    }

    const membership = await prisma.membership.findMany({
      where: { orgId },
      include: {
        user: { select: { id: true, email: true, profilePhoto: true } },
      },
    });

    return res.status(200).json({
      success: true,
      data: { membership },
    });
  },
);

router.delete(
  "/api/v1/membership/:userId/:orgId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const adminId = req.id;
    const userId = req.params.userId as string;
    const orgId = req.params.orgId as string;

    if (!(await hasRole(adminId, orgId, "admin"))) {
      return res.status(403).json({
        success: false,
        error: "UNAUTHORIZED",
      });
    }

    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: userId,
          orgId: orgId,
        },
      },
    });

    if (!targetMembership) {
      return res.status(404).json({
        success: false,
        error: "MEMBERSHIP_NOT_FOUND",
      });
    }

    if (targetMembership.role === "admin") {
      const adminCount = await prisma.membership.count({
        where: { orgId, role: "admin" },
      });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: "CANNOT_REMOVE_LAST_ADMIN",
        });
      }
    }

    await prisma.membership.delete({
      where: {
        userId_orgId: {
          userId: userId,
          orgId: orgId,
        },
      },
    });

    return res.status(200).json({
      success: true,
      msg: "USER_SUCCESSFULLY_DELETED",
    });
  },
);

export default router;
