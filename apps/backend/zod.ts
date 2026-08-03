import { password } from "bun";
import z, { email } from "zod";

export const SignupSchema = z.object({
    email: z.email(),
    password:z.string()  
})

export const OrgSchema = z.object({
    name:z.string(),
   description:z.string()
})