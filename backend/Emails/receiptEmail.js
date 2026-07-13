import { getResendClient, sender } from "../lib/resend.js";

export function createReceiptEmailTemplate({ fullName, plan, amount, currency, txRef, paidAt }) {
  const name = fullName || 'Customer';
  const date = paidAt ? new Date(paidAt).toLocaleString() : new Date().toLocaleString();
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Receipt</title>
  </head>
  <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="100%" style="max-width:560px;background:#ffffff;border-radius:8px;padding:24px;">
            <tr>
              <td>
                <h1 style="margin:0 0 12px 0;color:#111827;">Payment Receipt</h1>
                <p style="margin:0 0 8px 0;color:#374151;">Hi ${name},</p>
                <p style="margin:0 0 16px 0;color:#374151;">Thank you for your payment. Below are the details of your transaction.</p>
                <ul style="color:#374151;">
                  <li><strong>Plan:</strong> ${plan}</li>
                  <li><strong>Amount:</strong> ${currency || 'USD'} ${Number(amount || 0).toFixed(2)}</li>
                  <li><strong>Reference:</strong> ${txRef}</li>
                  <li><strong>Date:</strong> ${date}</li>
                </ul>
                <p style="margin-top:18px;color:#374151;">If you have any questions, reply to this email.</p>
                <p style="margin-top:8px;color:#374151;">— NetChill</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export const sendReceiptEmail = async ({ toEmail, fullName, plan, amount, currency, txRef, paidAt }) => {
  const resendClient = getResendClient();
  if (!resendClient) {
    console.warn('RESEND not configured - skipping receipt email');
    return null;
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: toEmail,
      subject: `Receipt - ${plan} subscription payment`,
      html: createReceiptEmailTemplate({ fullName, plan, amount, currency, txRef, paidAt }),
    });

    if (error) {
      console.error('Failed sending receipt email', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('sendReceiptEmail error', err);
    return null;
  }
};
