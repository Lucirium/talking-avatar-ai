import { z } from "zod";
import { GmailBaseTool } from "./base.js";
import { GET_MESSAGE_DESCRIPTION } from "./descriptions.js";
export class GmailSendMessage extends GmailBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "gmail_send_message"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                message: z.string(),
                to: z.array(z.string()),
                subject: z.string(),
                cc: z.array(z.string()).optional(),
                bcc: z.array(z.string()).optional(),
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: GET_MESSAGE_DESCRIPTION
        });
    }
    createEmailMessage({ message, to, subject, cc, bcc, }) {
        const emailLines = [];
        // Format the recipient(s)
        const formatEmailList = (emails) => Array.isArray(emails) ? emails.join(",") : emails;
        emailLines.push(`To: ${formatEmailList(to)}`);
        if (cc)
            emailLines.push(`Cc: ${formatEmailList(cc)}`);
        if (bcc)
            emailLines.push(`Bcc: ${formatEmailList(bcc)}`);
        emailLines.push(`Subject: ${subject}`);
        emailLines.push("");
        emailLines.push(message);
        // Convert the email message to base64url string
        const email = emailLines.join("\r\n").trim();
        // this encode may be an issue
        return Buffer.from(email).toString("base64url");
    }
    async _call({ message, to, subject, cc, bcc, }) {
        const rawMessage = this.createEmailMessage({
            message,
            to,
            subject,
            cc,
            bcc,
        });
        try {
            const response = await this.gmail.users.messages.send({
                userId: "me",
                requestBody: {
                    raw: rawMessage,
                },
            });
            return `Message sent. Message Id: ${response.data.id}`;
        }
        catch (error) {
            throw new Erreur(`An error occurred while sending the message: ${error}`);
        }
    }
}
