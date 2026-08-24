import express, { type Response, type Request } from "express";
import { SignupSchema, SigninSchema, UpdateUserSchema } from "../zod";
import { prisma } from "db/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../helper/authMiddleware";
import { success } from "zod";

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

  if (!existingUser.password) {
    return res.status(400).json({
      success: false,
      error: "SIGN_IN_WITH_GOOGLE_INSTEAD",
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
  "/api/v1/auth/google", 
  (req: Request, res: Response) => {
    const  state = crypto.randomUUID();
    const params = new URLSearchParams ({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      response_type: "code",
      scope: "openid email profile",
      state,
    });
  res.cookie("oauth_state", state , {httpOnly: true, maxAge: 5 * 60 * 1000});

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);

});

router.get(
  "/api/v1/auth/google/callback",
  async (req: Request, res: Response) => {
    const cookies = Object.fromEntries(
      (req.headers.cookie ?? "").split("; ").map((c)=> c.split("=")),
    );

    if(req.query.state !== cookies.oauth_state){
      return res.status(403).json({
        success:false,
        error:"UNAUTHORIZED"
      })
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method:"POST",
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code: req.query.code as string,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      })
    });

    const tokenData = (await tokenRes.json()) as { access_token: string };


    const profileRes = await fetch ("https://www.googleapis.com/oauth2/v3/userinfo",{
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profile = await profileRes.json() as {
      email:string;
      email_verified: boolean;
      name: string;
      picture: string;
    };

    if (!profile.email_verified){
      return res.status(403).json({
        success:false,
        error: "EMAIL_NOT_VERIFIED"
      });
    }
    let user = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          profilePhoto: profile.picture,
        },
      });
    } else if (!user.profilePhoto) {
      // account already existed (e.g. signed up with email/password first) —
      // backfill the Google photo since it was never set
      user = await prisma.user.update({
        where: { id: user.id },
        data: { profilePhoto: profile.picture },
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      JWT_SECRET,
    );

    // send the browser back into the SPA with the token, instead of dead-ending
    // on a raw JSON response at this backend URL
    return res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);

  },
);


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

router.put(
  "/api/v1/user/me",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { success, data } = UpdateUserSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "INVALID_REQUEST",
      });
    }

    const user = await prisma.user.update({
      where: { id: req.id },
      data: { description: data.description, profilePhoto: data.profile },
    });

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
