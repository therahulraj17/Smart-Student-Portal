const nodemailer = require('nodemailer');
const logger = require('./logger');

const isEmailConfigured = () => Boolean(
  process.env.EMAIL_HOST &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS &&
  process.env.EMAIL_FROM
);

const createTransporter = () => {
  if (!isEmailConfigured()) {
    throw new Error('Email service is not configured');
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send email helper
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email send failed to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Password reset email template
 */
const sendPasswordResetEmail = async (to, name, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Smart Student Portal</h2>
      <h3>Password Reset Request</h3>
      <p>Hi ${name},</p>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      <a href="${resetUrl}" style="
        display: inline-block;
        padding: 12px 24px;
        background: #4f46e5;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        margin: 16px 0;
      ">Reset Password</a>
      <p>This link expires in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr/>
      <small style="color: #6b7280;">Smart Student Portal — Secure Educational Platform</small>
    </div>
  `;
  return sendEmail({ to, subject: 'Password Reset Request — Smart Student Portal', html });
};

/**
 * Deadline reminder email
 */
const sendDeadlineReminderEmail = async (to, name, items) => {
  const itemsList = items.map(i =>
    `<li><strong>${i.title}</strong> — Due: ${new Date(i.dueDate).toLocaleDateString()}</li>`
  ).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Smart Student Portal</h2>
      <h3>⏰ Upcoming Deadline Reminder</h3>
      <p>Hi ${name},</p>
      <p>You have upcoming deadlines:</p>
      <ul>${itemsList}</ul>
      <p>Please submit on time!</p>
      <a href="${process.env.CLIENT_URL}/dashboard" style="
        display: inline-block;
        padding: 12px 24px;
        background: #4f46e5;
        color: white;
        text-decoration: none;
        border-radius: 6px;
      ">Go to Dashboard</a>
    </div>
  `;
  return sendEmail({ to, subject: '⏰ Deadline Reminder — Smart Student Portal', html });
};

module.exports = { sendEmail, sendPasswordResetEmail, sendDeadlineReminderEmail };
