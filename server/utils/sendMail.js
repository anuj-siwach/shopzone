// server/utils/sendMail.js
const sendMail = async (to, subject, html) => {
  // Email temporarily disabled
  console.log(`📧 Email would be sent to ${to}: ${subject}`);
};

const otpTemplate = (otp, name) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
  <h2 style="color:#131921;border-bottom:3px solid #FF9900;padding-bottom:10px;">ShopZone Verification</h2>
  <p>Hello <strong>${name}</strong>,</p>
  <p>Your email verification OTP is:</p>
  <div style="background:#131921;color:#FF9900;font-size:32px;font-weight:bold;text-align:center;padding:20px;border-radius:8px;letter-spacing:8px;margin:20px 0;">${otp}</div>
  <p>This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
</div>`;

const orderTemplate = (order, name) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
  <h2 style="color:#131921;border-bottom:3px solid #FF9900;padding-bottom:10px;">Order Confirmed! 🎉</h2>
  <p>Hello <strong>${name}</strong>, your order has been placed successfully.</p>
  <p><strong>Order ID:</strong> ${order._id}</p>
  <p><strong>Total:</strong> ₹${order.totalAmount.toLocaleString('en-IN')}</p>
</div>`;

module.exports = { sendMail, otpTemplate, orderTemplate };
