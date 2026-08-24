// src/services/emailService.js
// Handles live transactional email dispatching via Netlify Serverless Function & Resend API

export const sendResendEmail = async ({ to, subject, html }) => {
  try {
    // 1. Try Netlify Backend Function (Bypasses CORS restrictions)
    const netlifyRes = await fetch("/.netlify/functions/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });

    if (netlifyRes.ok) {
      const data = await netlifyRes.json();
      console.log("Email dispatched via Netlify Function:", data);
      return { success: true, data };
    }

    const netlifyErr = await netlifyRes.json().catch(() => ({}));
    console.warn("Netlify function fallback warning:", netlifyErr);

    // 2. Client-side fallback if direct API key available
    const apiKey = import.meta.env.VITE_RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
    if (apiKey) {
      const directRes = await fetch("https://api.resend.com/emails", {
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

      const directData = await directRes.json();
      if (directRes.ok) return { success: true, data: directData };
      return { success: false, error: directData.message || "Resend error" };
    }

    return { success: false, error: netlifyErr.error || "Failed to send email" };
  } catch (err) {
    console.log("Email dispatch notice: Serverless backend required for email delivery.");
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
