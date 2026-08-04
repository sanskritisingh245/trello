import { password } from "bun";
import z, { email } from "zod";

export const SignupSchema = z.object({
    email: z.email(),
    password:z.string(),
    profile:z.string(),
    description:z.string() 
})

export const OrgSchema = z.object({
    name:z.string(),
   description:z.string()
})

export const updateOrgSchema= z.object({
    name:z.string().optional(),
    description:z.string().optional()
})

export const BoardSchema =z.object({
    title:z.string(),
})

export const SectionSchema= z.object({
    title:z.string(),
    boardId:z.string(),
})

export const SectionUpdateSchema= z.object({
    title:z.string()
})

export const CommentsSchema = z.object({
    comment:z.string()
})

export const IssueSchema= z.object({
    title:z.string(),
    description:z.string(),
})

export const UpdateIssueSchema= z.object({
    title:z.string().optional(),
    description:z.string().optional(),
})

export const MembershipSchema= z.object({
    email:z.email(),
    orgId:z.string()
})