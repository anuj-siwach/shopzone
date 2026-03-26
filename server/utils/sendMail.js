// server/utils/sendMail.js
// Uses Brevo (formerly Sendinblue) SMTP — free 300 emails/day, no timeout issues
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

// ── Base Email Template ──────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Arial, sans-serif; background: #EAEDED; color: #0F1111; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 4px; overflow: hidden; }
    .header { background: #131921; padding: 20px 32px; }
    .logo { font-size: 26px; font-weight: 700; color: #FF9900; }
    .logo span { color: #fff; }
    .body { padding: 32px; }
    .body h2 { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #131921; }
    .body p { font-size: 14px; line-height: 1.7; color: #555; margin-bottom: 12px; }
    .otp-box { background: #131921; color: #FF9900; font-size: 36px; font-weight: 700; text-align: center; padding: 20px; border-radius: 6px; letter-spacing: 10px; margin: 20px 0; }
    .btn { display: inline-block; margin: 20px 0; padding: 12px 28px; background: #FF9900; color: #131921 !important; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 4px; }
    .order-box { background: #F8F8F8; border: 1px solid #DDD; border-radius: 4px; padding: 20px; margin: 16px 0; }
    .order-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #EEE; font-size: 13px; }
    .order-row:last-child { border-bottom: none; font-weight: 700; }
    .divider { border: none; border-top: 1px solid #EEE; margin: 24px 0; }
    .footer { background: #232F3E; padding: 16px 32px; text-align: center; }
    .footer p { font-size: 11px; color: #AAA; line-height: 1.8; }
    .badge { display: inline-block; background: #FF9900; color: #131921; padding: 3px 10px; border-radius: 3px; font-size: 11px; font-weight: 700; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><div class="logo">shop<span>Zone</span></div></div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ShopZone. All rights reserved.<br/>
      Developer: Anuj | anujsiwach002@gmail.com | +91 7015542002<br/>
      Pt. Neki Ram Sharma Govt. College, Rohtak | PGDCA 2025-26</p>
    </div>
  </div>
</body>
</html>`;

// ── Templates ────────────────────────────────────────────────────
const otpTemplate = (otp, name) => baseTemplate(`
  <div class="badge">EMAIL VERIFICATION</div>
  <h2>Hello, ${name}!</h2>
  <p>Use the OTP below to verify your ShopZone account:</p>
  <div class="otp-box">${otp}</div>
  <p>This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
  <hr class="divider"/>
  <p style="font-size:12px;color:#999;">If you didn't create a ShopZone account, ignore this email.</p>
`);

const orderTemplate = (order, name) => baseTemplate(`
  <div class="badge">ORDER CONFIRMED</div>
  <h2>Your order is confirmed! 🎉</h2>
  <p>Hi <strong>${name}</strong>, thank you for shopping with ShopZone!</p>
  <div class="order-box">
    <div class="order-row"><span>Order ID</span><span>#${order._id}</span></div>
    ${(order.items || []).map(i => `
      <div class="order-row">
        <span>${i.title} x ${i.qty}</span>
        <span>Rs.${(i.price * i.qty).toLocaleString('en-IN')}</span>
      </div>`).join('')}
    <div class="order-row"><span>Delivery</span><span>${order.deliveryCharge === 0 ? 'FREE' : 'Rs.' + order.deliveryCharge}</span></div>
    <div class="order-row"><span>Total</span><span>Rs.${order.totalAmount.toLocaleString('en-IN')}</span></div>
  </div>
  <p>Estimated Delivery: ${new Date(order.estimatedDelivery).toDateString()}</p>
  <a href="${process.env.CLIENT_URL || 'https://shopzone-gilt.vercel.app'}/orders" class="btn">Track Your Order</a>
`);

const passwordResetTemplate = (name, resetLink) => baseTemplate(`
  <div class="badge">PASSWORD RESET</div>
  <h2>Reset your password</h2>
  <p>Hi <strong>${name}</strong>, click below to reset your ShopZone password. Link expires in <strong>30 minutes</strong>.</p>
  <a href="${resetLink}" class="btn">Reset Password</a>
  <hr class="divider"/>
  <p style="font-size:12px;color:#999;">If you didn't request this, ignore this email.</p>
`);

const welcomeTemplate = (name) => baseTemplate(`
  <div class="badge">WELCOME</div>
  <h2>Welcome to ShopZone, ${name}!</h2>
  <p>Your account is verified! Use coupon <strong>FIRST10</strong> for 10% off your first order.</p>
  <a href="${process.env.CLIENT_URL || 'https://shopzone-gilt.vercel.app'}" class="btn">Start Shopping</a>
`);

// ── Send Function ────────────────────────────────────────────────
const sendMail = async (to, subject, html) => {
  try {
    if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_KEY) {
      console.log(`[DEV] Email skipped (no Brevo config): ${subject} to ${to}`);
      return;
    }
    const info = await transporter.sendMail({
      from: `"${process.env.BREVO_SENDER_NAME || 'ShopZone'}" <${process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to} | ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email send failed:', error.message);
    // Never throw — email failure must NOT break order placement or registration
  }
};

module.exports = { sendMail, otpTemplate, orderTemplate, passwordResetTemplate, welcomeTemplate };
