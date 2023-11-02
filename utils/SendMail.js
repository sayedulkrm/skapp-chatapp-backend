import nodemailer from "nodemailer";

import ejs from "ejs";

import path from "path";
import { fileURLToPath } from "url";

const SendMail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const { email, subject, template, data } = options;

    // Use import.meta.url to obtain the current module's URL and convert it to a file path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // get the path to the email template file

    const templatePath = path.join(__dirname, "../mails", template);

    // Render the email template with ejs

    const html = await ejs.renderFile(templatePath, data);

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html,
    };

    await transporter.sendMail(mailOptions);
};

export default SendMail;
