import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { recipient, subject, content } = req.body;

  if (!recipient || !subject || !content) {
    return res.status(400).json({ message: 'Missing required fields: recipient, subject, content' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'FleetPulse <onboarding@resend.dev>', // This will work for testing
      to: [recipient],
      subject: subject,
      html: `<pre style="font-family: monospace; white-space: pre-wrap;">${content}</pre>`,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ message: 'Failed to send email via Resend', error });
    }

    return res.status(200).json({ message: 'Email sent successfully', data });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
