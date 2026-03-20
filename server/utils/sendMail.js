// server/utils/sendMail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `ShopZone <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error('Email send error:', err.message);
    // Don't throw — email failure shouldn't break the request
  }
};

const otpTemplate = (otp, name) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
  <h2 style="color:#131921;border-bottom:3px solid #FF9900;padding-bottom:10px;">ShopZone Verification</h2>
  <p>Hello <strong>${name}</strong>,</p>
  <p>Your email verification OTP is:</p>
  <div style="background:#131921;color:#FF9900;font-size:32px;font-weight:bold;text-align:center;padding:20px;border-radius:8px;letter-spacing:8px;margin:20px 0;">${otp}</div>
  <p>This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
  <p style="color:#888;font-size:12px;margin-top:20px;">Developer: Anuj | anujsiwach002@gmail.com | +91 7015542002</p>
</div>`;

const orderTemplate = (order, name) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
  <h2 style="color:#131921;border-bottom:3px solid #FF9900;padding-bottom:10px;">Order Confirmed! 🎉</h2>
  <p>Hello <strong>${name}</strong>, your order has been placed successfully.</p>
  <p><strong>Order ID:</strong> ${order._id}</p>
  <p><strong>Total:</strong> ₹${order.totalAmount.toLocaleString('en-IN')}</p>
  <p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toDateString()}</p>
  <div style="background:#F8F8F8;padding:15px;border-radius:6px;margin:15px 0;">
    ${order.items.map(i => `<div style="margin:5px 0;">📦 ${i.title} × ${i.qty} — ₹${(i.price*i.qty).toLocaleString('en-IN')}</div>`).join('')}
  </div>
  <p style="color:#888;font-size:12px;">ShopZone | Developer: Anuj | anujsiwach002@gmail.com</p>
</div>`;

module.exports = { sendMail, otpTemplate, orderTemplate };
