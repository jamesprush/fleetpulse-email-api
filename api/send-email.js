// Vercel serverless function for sending emails
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subject, content, recipient } = req.body;

    if (!subject || !content || !recipient) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await resend.emails.send({
      from: 'FleetPulse <noreply@fleetpulse.app>',
      to: [recipient],
      subject: subject,
      text: content,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
