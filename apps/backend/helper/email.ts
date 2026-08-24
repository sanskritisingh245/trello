import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if(!RESEND_API_KEY){
    throw new Error ("RESEND_API_KEY environment variable is not set");
}


const resend = new Resend(RESEND_API_KEY);



export async function sendInviteEmail(to: string, orgName:string, inviteCode:string) {
    try{
        const {data, error} = await resend.emails.send({
            from: "Trello Clone <invites@mail.sanskriti.xyz>",
            to,
            subject: `You've been invited to join ${orgName}`,
            html: `<p>You've been invited to join <strong>${orgName}</strong>. Sign in, choose "Join an organization," and paste this invite code:</p><p><code>${inviteCode}</code></p>`,

        });
    
        if (error){
            console.error("Failed to send invite email:", error);
        }
    }catch (e) {
      console.error("Failed to send invite email:", e);
    }
}


export async function sendPasswordResetEmail(to: string, code:string){
    try{
        const {data, error} = await resend.emails.send({
            from: "Trello Clone <invite@mail.sanskriti.xyz>",
            to,
            subject: "Reset your password",
            html: `<p>Your password reset code is:</p><p><code>${code}</code></p><p>This code expires in 15 minutes.</p>`,
        });
        
        if(error) {
            console.error("Failed to send password reset email:", error);
        }
    } catch(e) {
        console.error("Failed to send password reset email:",e);
    }
}