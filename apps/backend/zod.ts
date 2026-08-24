import z from "zod";

export const SignupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  profile: z.string(),
  description: z.string(),
});

export const SigninSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const OrgSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
});

export const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const BoardSchema = z.object({
  title: z.string().min(1),
  orgId: z.string(),
});

export const BoardUpdateSchema = z.object({
  title: z.string().min(1),
});

export const SectionSchema = z.object({
  title: z.string().min(1),
  boardId: z.string(),
});

export const SectionUpdateSchema = z.object({
  title: z.string().min(1),
});

export const CommentsSchema = z.object({
  comment: z.string().min(1),
});

export const IssueSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
});

export const UpdateIssueSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const MembershipSchema = z.object({
  email: z.email(),
  orgId: z.string(),
});

export const UpdateUserSchema = z.object({
  description: z.string().optional(),
  profile: z.string().optional(),
});
