import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';

// Configure your email service here
// For development, you can use Ethereal or a real service like Gmail, SendGrid, etc.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@consultancy.com',
      to,
      subject,
      html: htmlContent
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

export const sendOrderConfirmation = async (user, order) => {
  const htmlContent = `
    <h2>Order Confirmation</h2>
    <p>Thank you for your order!</p>
    <p><strong>Order ID:</strong> ${order._id}</p>
    <p><strong>Total:</strong> $${order.total}</p>
    <p>Your order will be processed shortly.</p>
  `;
  
  await sendEmail(user.email, 'Order Confirmation', htmlContent);
};

export const sendPaymentNotification = async (user, payment) => {
  const htmlContent = `
    <h2>Payment Received</h2>
    <p>Thank you for your payment!</p>
    <p><strong>Amount:</strong> $${payment.amount}</p>
    <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
  `;
  
  await sendEmail(user.email, 'Payment Confirmation', htmlContent);
};

export const sendLowStockAlert = async (admin, products) => {
  const productList = products.map(p => `<li>${p.name} (Stock: ${p.stock})</li>`).join('');
  const htmlContent = `
    <h2>Low Stock Alert</h2>
    <p>The following products have low stock:</p>
    <ul>${productList}</ul>
    <p>Please reorder soon.</p>
  `;
  
  await sendEmail(admin.email, 'Low Stock Alert', htmlContent);
};

export const createNotification = async (userId, type, title, message, data = null) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data,
      deliveryStatus: 'sent'
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

export default { sendEmail, sendOrderConfirmation, sendPaymentNotification, sendLowStockAlert, createNotification };
