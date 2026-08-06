import express, { type Response, type Request } from "express";
import { SignupSchema, SigninSchema } from "../zod";
import { prisma } from "db/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../helper/authMiddleware";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

const router = express.Router();

router.post("/api/v1/signup", async (req: Request, res: Response) => {
  const { success, data } = SignupSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({
      success: false,
      error: "INVALID_REQUEST",
    });
  }
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: "user already exists please signin",
    });
  }

  const hash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hash,
      profilePhoto: data.profile,
      description: data.description,
    },
  });
  return res.status(200).json({
    success: true,
    msg: "SUCCESSFULLY_SIGNEDUP",
  });
});

router.post("/api/v1/signin", async (req: Request, res: Response) => {
  const { success, data } = SigninSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({
      success: false,
      error: "INVALID_REQUEST",
    });
  }
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (!existingUser) {
    return res.status(400).json({
      success: false,
      error: "USER_NOT_FOUND_PLEASE_SIGNUP",
    });
  }

  const password = await bcrypt.compare(data.password, existingUser.password);
  if (!password) {
    return res.status(400).json({
      success: false,
      error: "INCORRECT_PASSWORD",
    });
  }
  const token = jwt.sign(
    {
      id: existingUser.id,
      email: existingUser.email,
    },
    JWT_SECRET,
  );

  return res.status(200).json({
    success: true,
    data: token,
    msg: "USER_SUCCESSFULLY_SIGNEDIN",
  });
});

router.get(
  "/api/v1/user/me",
  authMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.id;
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    return res.status(200).json({
      success: true,
      data: {
        email: user?.email,
        profile: user?.profilePhoto,
        description: user?.description,
      },
    });
  },
);

router.get(
  "/api/v1/user/:userId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.id;
    const profileId = req.params.userId as string;
    if (!profileId) {
      return res.status(400).json({
        success: false,
        error: "PLEASE_PROVIDE_USERID",
      });
    }
    const user = await prisma.user.findUnique({
      where: {
        id: profileId,
      },
      include: {
        membership: true,
      },
      omit: {
        password: true,
      },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
      });
    }
    const membership = await prisma.membership.findMany({
      where: {
        userId: userId,
      },
    });
    const user_membership = await prisma.membership.findMany({
      where: {
        userId: profileId,
      },
    });

    const myOrgIds = new Set(membership.map((m) => m.orgId));
    const sharesOrg = user_membership.some((m) => myOrgIds.has(m.orgId));

    if (!sharesOrg) {
      return res.status(403).json({
        success: false,
        error: "UNAUTHORIZED",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        email: user.email,
        profile: user.profilePhoto,
        description: user.description,
      },
    });
  },
);

export default router;
