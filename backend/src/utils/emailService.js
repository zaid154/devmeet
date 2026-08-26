require('dotenv').config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Fallback: Gmail SMTP via nodemailer
let nodemailerTransporter = null;
function getNodemailerTransporter() {
    if (!nodemailerTransporter) {
        const nodemailer = require('nodemailer');
        nodemailerTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER || 'trendykart.app@gmail.com',
                pass: process.env.SMTP_PASS || 'ziqyiszqfggqgrjm'
            }
        });
    }
    return nodemailerTransporter;
}

/**
 * Send email via Brevo API (primary) with Gmail SMTP fallback
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.text
 * @param {string} options.html
 */
const sendEmail = async ({ to, subject, text, html }) => {
    const senderEmail = process.env.SMTP_USER || 'trendykart.app@gmail.com';
    const senderName = 'DevMeet';

    // Primary: Brevo API
    if (BREVO_API_KEY) {
        try {
            const response = await fetch(BREVO_API_URL, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: senderName, email: senderEmail },
                    to: [{ email: to }],
                    subject: subject,
                    htmlContent: html || `<p>${text || ''}</p>`,
                    textContent: text || ''
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`[EMAIL SERVICE] Brevo: Email sent to ${to} (MessageId: ${data.messageId})`);
                return { success: true, info: data };
            } else {
                console.error(`[EMAIL SERVICE] Brevo error:`, data.message || JSON.stringify(data));
                // Fall through to Gmail fallback
            }
        } catch (brevoErr) {
            console.error(`[EMAIL SERVICE] Brevo fetch error:`, brevoErr.message);
            // Fall through to Gmail fallback
        }
    }

    // Fallback: Gmail SMTP via nodemailer
    try {
        console.log(`[EMAIL SERVICE] Using Gmail SMTP fallback for ${to}`);
        const transporter = getNodemailerTransporter();
        const info = await transporter.sendMail({
            from: `${senderName} <${senderEmail}>`,
            to,
            subject,
            text: text || '',
            html: html || ''
        });
        console.log(`[EMAIL SERVICE] Gmail: Email sent to ${to} (MessageId: ${info.messageId})`);
        return { success: true, info };
    } catch (gmailErr) {
        console.error(`[EMAIL SERVICE ERROR] Gmail fallback failed for ${to}:`, gmailErr.message);
        return { success: false, error: gmailErr.message };
    }
};

module.exports = { sendEmail };
