// ============================================
// EMAIL TEMPLATES ROUTES
// ============================================

import { Router, Request, Response } from 'express';

const router = Router();

// Email template definitions
const EMAIL_TEMPLATES = {
    ORDER_CONFIRMATION: {
        id: 'ORDER_CONFIRMATION',
        name: 'Order Confirmation',
        subject: 'Your Order {{orderNumber}} has been confirmed!',
        description: 'Sent when a new order is created',
        variables: ['orderNumber', 'customerName', 'totalAmount', 'orderDate'],
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f5; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1, #3b82f6); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .order-box { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .order-number { font-size: 20px; font-weight: bold; color: #6366f1; }
    .amount { font-size: 28px; font-weight: bold; color: #10b981; }
    .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 Order Confirmed!</h1>
    </div>
    <div class="content">
      <p>Dear <strong>{{customerName}}</strong>,</p>
      <p>Thank you for your order! We're excited to get started on it.</p>
      
      <div class="order-box">
        <p class="order-number">Order #{{orderNumber}}</p>
        <p>Date: {{orderDate}}</p>
        <p class="amount">\${{totalAmount}}</p>
      </div>
      
      <p>We'll notify you when your order ships.</p>
      
      <a href="#" class="btn">Track Your Order</a>
    </div>
    <div class="footer">
      <p>© 2024 Marketplace Admin System</p>
    </div>
  </div>
</body>
</html>`
    },

    ORDER_SHIPPED: {
        id: 'ORDER_SHIPPED',
        name: 'Order Shipped',
        subject: 'Your Order {{orderNumber}} is on its way! 🚚',
        description: 'Sent when order status changes to SHIPPED',
        variables: ['orderNumber', 'customerName', 'trackingNumber', 'estimatedDelivery'],
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f5; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3b82f6, #10b981); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .tracking-box { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .tracking-number { font-size: 24px; font-weight: bold; color: #10b981; letter-spacing: 2px; }
    .timeline { display: flex; justify-content: space-between; margin: 30px 0; }
    .step { text-align: center; flex: 1; }
    .step-dot { width: 30px; height: 30px; border-radius: 50%; margin: 0 auto 10px; line-height: 30px; }
    .step-dot.completed { background: #10b981; color: white; }
    .step-dot.active { background: #3b82f6; color: white; }
    .step-dot.pending { background: #e5e7eb; color: #6b7280; }
    .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚚 Your Order is Shipped!</h1>
    </div>
    <div class="content">
      <p>Dear <strong>{{customerName}}</strong>,</p>
      <p>Great news! Your order <strong>#{{orderNumber}}</strong> is on its way to you!</p>
      
      <div class="tracking-box">
        <p>Tracking Number:</p>
        <p class="tracking-number">{{trackingNumber}}</p>
      </div>
      
      <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
      
      <a href="#" class="btn">Track Shipment</a>
    </div>
    <div class="footer">
      <p>© 2024 Marketplace Admin System</p>
    </div>
  </div>
</body>
</html>`
    },

    PAYMENT_REMINDER: {
        id: 'PAYMENT_REMINDER',
        name: 'Payment Reminder',
        subject: '⏰ Reminder: Complete your payment for Order #{{orderNumber}}',
        description: 'Sent when payment is overdue',
        variables: ['orderNumber', 'customerName', 'totalAmount', 'paymentDeadline'],
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f5; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; }
    .amount { font-size: 28px; font-weight: bold; color: #ef4444; }
    .btn { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Payment Reminder</h1>
    </div>
    <div class="content">
      <p>Dear <strong>{{customerName}}</strong>,</p>
      
      <div class="warning-box">
        <p><strong>Your order #{{orderNumber}} is awaiting payment.</strong></p>
        <p>Please complete your payment to avoid cancellation.</p>
      </div>
      
      <p>Amount Due: <span class="amount">\${{totalAmount}}</span></p>
      <p>Deadline: <strong>{{paymentDeadline}}</strong></p>
      
      <a href="#" class="btn">Pay Now</a>
    </div>
    <div class="footer">
      <p>© 2024 Marketplace Admin System</p>
    </div>
  </div>
</body>
</html>`
    }
};

/**
 * GET /email-templates
 * List all email templates
 */
router.get('/', (_req: Request, res: Response) => {
    const templates = Object.values(EMAIL_TEMPLATES).map(t => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        description: t.description,
        variables: t.variables
    }));

    res.json({
        success: true,
        count: templates.length,
        data: templates
    });
});

/**
 * GET /email-templates/:id
 * Get specific template with HTML
 */
router.get('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const template = EMAIL_TEMPLATES[id as keyof typeof EMAIL_TEMPLATES];

    if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({
        success: true,
        data: template
    });
});

/**
 * POST /email-templates/:id/preview
 * Preview template with sample data
 */
router.post('/:id/preview', (req: Request, res: Response) => {
    const { id } = req.params;
    const template = EMAIL_TEMPLATES[id as keyof typeof EMAIL_TEMPLATES];

    if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
    }

    // Sample data for preview
    const sampleData: Record<string, string> = {
        orderNumber: 'ORD-2026-001',
        customerName: 'Ahmed Mohamed',
        totalAmount: '299.99',
        orderDate: new Date().toLocaleDateString(),
        trackingNumber: 'TRK-123456789',
        estimatedDelivery: '3-5 business days',
        paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString(),
        ...req.body
    };

    // Replace variables in template
    let html = template.html;
    let subject = template.subject;

    Object.entries(sampleData).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, value);
        subject = subject.replace(regex, value);
    });

    res.json({
        success: true,
        data: {
            subject,
            html
        }
    });
});

export default router;
