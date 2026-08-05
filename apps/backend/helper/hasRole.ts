import { prisma } from "db/client";

export const hasRole = async (
  userId: string,
  orgId: string,
  role: "admin" | "member",
) => {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      orgId,
    },
  });
  return membership?.role === role;
};
