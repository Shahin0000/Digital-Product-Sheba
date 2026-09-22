import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory signed download token store (token -> { orderId, productId, fileUrl, fileName, expiresAt, userId })
const activeDownloadTokens = new Map<
  string,
  {
    orderId: string;
    productId: string;
    fileUrl: string;
    fileName: string;
    expiresAt: number;
    userId: string;
  }
>();

// Clean expired tokens every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of activeDownloadTokens.entries()) {
    if (data.expiresAt < now) {
      activeDownloadTokens.delete(token);
    }
  }
}, 15 * 60 * 1000);

// ==========================================
// 1. HEALTH CHECK
// ==========================================
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Digital Product Sheba Delivery API',
  });
});

// ==========================================
// 2. EMAIL & WHATSAPP NOTIFICATION DISPATCH
// ==========================================
app.post('/api/deliveries/send-notifications', async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      notificationType = 'all', // 'all' | 'email' | 'whatsapp'
      customerName = 'Valued Customer',
      customerEmail,
      customerPhone,
      productName = 'Digital Product',
      amount = 0,
      orderUrl,
      downloadUrl,
      credentialsOrKey,
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const results: {
      emailStatus: 'sent' | 'failed' | 'skipped' | 'not_configured';
      emailError?: string | null;
      whatsappStatus: 'sent' | 'failed' | 'skipped' | 'not_configured';
      whatsappError?: string | null;
    } = {
      emailStatus: 'skipped',
      whatsappStatus: 'skipped',
    };

    // ----------------------------------------
    // A. EMAIL DELIVERY (via Resend API)
    // ----------------------------------------
    if (notificationType === 'all' || notificationType === 'email') {
      if (!customerEmail || !customerEmail.includes('@')) {
        results.emailStatus = 'failed';
        results.emailError = 'Invalid customer email address';
      } else {
        const resendApiKey = process.env.RESEND_API_KEY;
        const senderEmail = process.env.EMAIL_FROM || 'Digital Product Sheba <orders@resend.dev>';

        if (!resendApiKey) {
          console.warn(
            `[Delivery Notification] Email send requested for Order ${orderId}, but RESEND_API_KEY is not configured.`
          );
          results.emailStatus = 'not_configured';
          results.emailError =
            'RESEND_API_KEY environment variable is not configured on the server.';
        } else {
          try {
            console.log(`[Delivery Notification] Sending email via Resend to ${customerEmail}...`);
            const emailHtml = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <title>Order Delivered - Digital Product Sheba</title>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 24px; color: #111827;">
                  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 24px; color: #ffffff; text-align: center;">
                      <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Digital Product Sheba</h1>
                      <p style="margin: 6px 0 0 0; font-size: 13px; color: #a7f3d0;">Order Delivery Confirmation</p>
                    </div>

                    <div style="padding: 24px;">
                      <h2 style="font-size: 18px; font-weight: 700; color: #065f46; margin-top: 0;">🎉 Your order has been delivered!</h2>
                      <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
                        Dear <strong>${customerName}</strong>,<br>
                        Your payment for order <strong>#${orderId}</strong> has been verified and your digital product is ready for access.
                      </p>

                      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0;">
                        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 4px 0; color: #374151; font-weight: 600;">Order ID:</td>
                            <td style="padding: 4px 0; color: #111827; font-weight: 700; text-align: right;">#${orderId}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; color: #374151; font-weight: 600;">Product:</td>
                            <td style="padding: 4px 0; color: #111827; font-weight: 700; text-align: right;">${productName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; color: #374151; font-weight: 600;">Amount Paid:</td>
                            <td style="padding: 4px 0; color: #059669; font-weight: 800; text-align: right;">৳${amount}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; color: #374151; font-weight: 600;">Delivery Status:</td>
                            <td style="padding: 4px 0; color: #059669; font-weight: 700; text-align: right;">DELIVERED</td>
                          </tr>
                        </table>
                      </div>

                      ${
                        credentialsOrKey
                          ? `
                        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; margin: 18px 0;">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Product License / Credentials:</div>
                          <pre style="margin: 8px 0 0 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-size: 13px; font-family: monospace; color: #0f172a; white-space: pre-wrap; word-break: break-all;">${credentialsOrKey}</pre>
                        </div>
                      `
                          : ''
                      }

                      <div style="text-align: center; margin: 28px 0 12px 0;">
                        ${
                          downloadUrl
                            ? `
                          <a href="${downloadUrl}" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; margin-right: 8px;">
                            📥 Download Product
                          </a>
                        `
                            : ''
                        }
                        <a href="${orderUrl || 'https://digitalproductsheba.com'}" style="display: inline-block; background: #1f2937; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 14px;">
                          View in Customer Panel
                        </a>
                      </div>

                      <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 24px;">
                        Need assistance? Contact our 24/7 WhatsApp support at 01700-000000.
                      </p>
                    </div>
                  </div>
                </body>
              </html>
            `;

            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: senderEmail,
                to: [customerEmail],
                subject: `🎉 Order #${orderId} Delivered: ${productName} - Digital Product Sheba`,
                html: emailHtml,
              }),
            });

            if (emailResponse.ok) {
              const resData = await emailResponse.json();
              console.log(`[Delivery Notification] Resend email success:`, resData);
              results.emailStatus = 'sent';
            } else {
              const errData = await emailResponse.text();
              console.error(`[Delivery Notification] Resend error:`, errData);
              results.emailStatus = 'failed';
              results.emailError = `Resend API Error: ${errData.substring(0, 120)}`;
            }
          } catch (mailErr: any) {
            console.error(`[Delivery Notification] Failed to send email:`, mailErr);
            results.emailStatus = 'failed';
            results.emailError = mailErr?.message || 'Email delivery connection error';
          }
        }
      }
    }

    // ----------------------------------------
    // B. WHATSAPP DELIVERY (via Meta Cloud API)
    // ----------------------------------------
    if (notificationType === 'all' || notificationType === 'whatsapp') {
      if (!customerPhone || customerPhone.replace(/[^0-9]/g, '').length < 10) {
        results.whatsappStatus = 'failed';
        results.whatsappError = 'Invalid customer phone number for WhatsApp';
      } else {
        const whatsappToken = process.env.WHATSAPP_API_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!whatsappToken || !phoneId) {
          console.warn(
            `[Delivery Notification] WhatsApp notification requested for Order ${orderId}, but WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured.`
          );
          results.whatsappStatus = 'not_configured';
          results.whatsappError =
            'WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured on server.';
        } else {
          try {
            // Normalize Bangladesh phone number (017... -> 88017...)
            let formattedPhone = customerPhone.replace(/[^0-9]/g, '');
            if (formattedPhone.startsWith('01') && formattedPhone.length === 11) {
              formattedPhone = '880' + formattedPhone.substring(1);
            } else if (formattedPhone.startsWith('880')) {
              // already valid
            }

            const messageText =
              `🎉 Your order has been delivered!\n\n` +
              `Order ID: #${orderId}\n` +
              `Product: ${productName}\n` +
              `Amount: ৳${amount}\n\n` +
              (downloadUrl ? `Download: ${downloadUrl}\n` : '') +
              (credentialsOrKey ? `Key/Credentials: ${credentialsOrKey}\n` : '') +
              `Customer Panel: ${orderUrl || 'https://digitalproductsheba.com'}\n\n` +
              `Thank you for purchasing from Digital Product Sheba!`;

            console.log(
              `[Delivery Notification] Sending WhatsApp message via Meta Cloud API to ${formattedPhone}...`
            );

            const waResponse = await fetch(
              `https://graph.facebook.com/v19.0/${phoneId}/messages`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${whatsappToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  recipient_type: 'individual',
                  to: formattedPhone,
                  type: 'text',
                  text: {
                    preview_url: true,
                    body: messageText,
                  },
                }),
              }
            );

            if (waResponse.ok) {
              const waData = await waResponse.json();
              console.log(`[Delivery Notification] WhatsApp sent successfully:`, waData);
              results.whatsappStatus = 'sent';
            } else {
              const waErr = await waResponse.text();
              console.error(`[Delivery Notification] WhatsApp API Error:`, waErr);
              results.whatsappStatus = 'failed';
              results.whatsappError = `WhatsApp Cloud API Error: ${waErr.substring(0, 120)}`;
            }
          } catch (waErr: any) {
            console.error(`[Delivery Notification] WhatsApp network failure:`, waErr);
            results.whatsappStatus = 'failed';
            results.whatsappError = waErr?.message || 'WhatsApp Cloud API request failed';
          }
        }
      }
    }

    return res.json({
      success: true,
      orderId,
      ...results,
    });
  } catch (err: any) {
    console.error('Notification dispatch error:', err);
    return res.status(500).json({
      error: 'Failed to process notifications',
      details: err?.message || String(err),
    });
  }
});

// ==========================================
// 3. SECURE DOWNLOAD TOKEN GENERATION
// ==========================================
app.post('/api/downloads/generate-url', (req: Request, res: Response) => {
  try {
    const { orderId, productId, userId, rawFileUrl, fileName = 'digital-product.zip' } = req.body;

    if (!orderId || !productId || !userId) {
      return res.status(400).json({ error: 'orderId, productId, and userId are required' });
    }

    if (!rawFileUrl) {
      return res.status(400).json({ error: 'No digital product file associated with this order' });
    }

    // Generate cryptographic temporary token valid for 30 minutes
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

    activeDownloadTokens.set(token, {
      orderId,
      productId,
      fileUrl: rawFileUrl,
      fileName,
      expiresAt,
      userId,
    });

    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const secureDownloadUrl = `${protocol}://${host}/api/downloads/secure/${token}`;

    return res.json({
      success: true,
      token,
      downloadUrl: secureDownloadUrl,
      expiresInSeconds: 1800,
      fileName,
    });
  } catch (err: any) {
    console.error('Generate download token error:', err);
    return res.status(500).json({ error: 'Failed to generate secure download token' });
  }
});

// ==========================================
// 4. SECURE DOWNLOAD FILE REDIRECT / STREAM
// ==========================================
app.get('/api/downloads/secure/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const tokenData = activeDownloadTokens.get(token);

  if (!tokenData) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Download Link Expired</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 48px;">
          <h2 style="color: #dc2626;">Link Expired or Invalid</h2>
          <p>This secure digital product download link has expired or is invalid.</p>
          <p>Please return to your <strong>Customer Dashboard &gt; My Orders</strong> to request a fresh secure download link.</p>
        </body>
      </html>
    `);
  }

  if (Date.now() > tokenData.expiresAt) {
    activeDownloadTokens.delete(token);
    return res.status(410).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Download Link Expired</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 48px;">
          <h2 style="color: #dc2626;">Download Link Expired</h2>
          <p>For security, download links expire after 30 minutes.</p>
          <p>Please return to your <strong>Customer Dashboard</strong> to generate a new download link.</p>
        </body>
      </html>
    `);
  }

  // Set download headers
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(tokenData.fileName)}"`);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  // Redirect to the underlying signed Firebase Storage file URL
  return res.redirect(tokenData.fileUrl);
});

// ==========================================
// 5. VITE & STATIC FILE SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Product Sheba server running on port ${PORT}`);
  });
}

startServer();
