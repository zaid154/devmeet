const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER || 'trendykart.app@gmail.com',
        pass: process.env.SMTP_PASS || 'ziqyiszqfggqgrjm'
    }
});

/**
 * Send email helper function
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.text
 * @param {string} options.html
 */
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || 'DevMeet <trendykart.app@gmail.com>',
            to,
            subject,
            text: text || '',
            html: html || ''
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] Email successfully sent to ${to} (MessageId: ${info.messageId})`);
        return { success: true, info };
    } catch (error) {
        console.error(`[EMAIL SERVICE ERROR] Failed to send email to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { sendEmail };
