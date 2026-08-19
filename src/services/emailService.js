// src/services/emailService.js
// Handles live transactional email dispatching via Resend HTTP REST API

export const sendResendEmail = async ({ to, subject, html }) => {
  // Support both VITE_RESEND_API_KEY and RESEND_API_KEY
  const apiKey = import.meta.env.VITE_RESEND_API_KEY || import.meta.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("Resend API Key missing. Please set VITE_RESEND_API_KEY in .env");
    return { success: false, error: "API key missing" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        from: "Glitch Room <onboarding@resend.dev>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend API Error:", result);
      // Helpful alert for testing mode limitation
      if (result.message?.includes("only send testing emails to your own email")) {
        console.warn("Resend Testing Restriction: You must send emails to the email address you signed up with on Resend until a custom domain is added.");
      }
      return { success: false, error: result.message || "Failed to send email" };
    }

    console.log("Resend Email Dispatched Successfully:", result);
    return { success: true, data: result };
  } catch (err) {
    console.error("Resend Email Exception:", err);
    return { success: false, error: err.message };
  }
};

export const sendStandupDigestEmail = async ({ toEmail, username, roomTitle, accomplishment, proofUrl }) => {
  return sendResendEmail({
    to: toEmail,
    subject: `⚡ Daily Standup Activity: ${roomTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #07070d; color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #222;">
        <h2 style="color: #FF00C8; margin-top: 0;">Glitch Room Standup Activity ⚡</h2>
        <p style="font-size: 14px; color: #ddd;">
          Builder <strong>${username}</strong> just logged today's daily standup proof of work in <strong>${roomTitle}</strong>!
        </p>
        <div style="background: #111122; padding: 16px; border-radius: 12px; border: 1px solid #333; margin-top: 16px;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #aaa;">WHAT WAS ACCOMPLISHED</p>
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #fff;">${accomplishment}</p>
          ${
            proofUrl
              ? `<p style="margin: 0 0 4px 0; font-size: 13px; color: #aaa;">PROOF OF WORK</p>
                 <a href="${proofUrl}" style="color: #00F0FF; word-break: break-all; font-size: 13px;">${proofUrl}</a>`
              : ""
          }
        </div>
        <p style="margin-top: 24px; font-size: 11px; color: #666; font-family: monospace;">
          Glitch Room Accountability Network · Protecting builder streaks
        </p>
      </div>
    `,
  });
};

export const sendTestConfirmationEmail = async (toEmail) => {
  return sendResendEmail({
    to: toEmail,
    subject: "✅ Glitch Room Email Notifications Activated",
    html: `
      <div style="font-family: Arial, sans-serif; background: #07070d; color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #222;">
        <h2 style="color: #00F0FF; margin-top: 0;">Email Notifications Connected! ⚡</h2>
        <p style="font-size: 14px; color: #ddd;">
          Your Glitch Room email notification preferences are now active. You will receive automated standup reminders and squad digests directly in your inbox.
        </p>
        <div style="background: #111122; padding: 12px 16px; border-radius: 10px; border: 1px solid #333; margin-top: 16px; font-size: 12px; color: #a855f7;">
          Status: Active · Transactional Service via Resend
        </div>
      </div>
    `,
  });
};
