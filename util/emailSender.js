const fs = require('fs');
const path = require('path');

const HttpError = require('./httpError');

const nodemailer = require('nodemailer');

const replaceContent = (content, creds) => {

    const allKeys = Object.keys(creds);

    allKeys.forEach((key) => {
        content = content.replace(`#{${key}}`, creds[key]);
    });

    return content;
}

const emailSender = async (template, receiverEmail, creds, subject, attachment) => {

    try{
        const templatePath = path.join(__dirname, '..', 'templates', template);
    
        let content = await fs.promises.readFile(templatePath, "utf-8");
    
        const mailOptions = {
            from: `"Flick Tickets" ${process.env.BREVO_SMTP_SENDER}`,
            to: receiverEmail,
            subject: subject,
            html: replaceContent(content, creds)
        }

        if(attachment){
            mailOptions.attachments = [
                {
                    filename: attachment.filename,
                    content: attachment.content,
                    contentType: attachment.contentType
                }
            ];
        }
    
        const transporter = nodemailer.createTransport({
            host: process.env.BREVO_SMTP_HOST,
            port: process.env.BREVO_SMTP_PORT,
            secure:false,
            auth:{
                user: process.env.BREVO_SMTP_LOGIN,
                pass: process.env.BREVO_SMTP_PASSWORD
            }
        });
    
        await transporter.sendMail(mailOptions);
    }
    catch(err){
        throw new HttpError(err.message, 500);
    }
}

module.exports = emailSender;