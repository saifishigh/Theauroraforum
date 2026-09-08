import { Resend } from 'resend';

/**
 * Serverless function to handle TAFMUN registration.
 * Expects POST request with JSON body containing:
 * - fullName: string
 * - grade: string
 * - school: string
 * - committee: string
 * - paymentProofBase64: string (base64 encoded image)
 * - paymentProofMime: string (e.g. "image/png")
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fullName, grade, school, committee, paymentProofBase64, paymentProofMime } = req.body || {};

  // Server-side validation (never trust the client alone)
  if (!fullName || !grade || !school || !committee) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!paymentProofBase64 || !paymentProofMime) {
    return res.status(400).json({ error: 'Payment screenshot is required' });
  }

  // Validate file type (allow only JPG, JPEG, PNG, WEBP)
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(paymentProofMime)) {
    return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG or WEBP are allowed.' });
  }

  // Env variables – set these in Vercel dashboard
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.TAFMUN_RECIPIENT_EMAIL;
  const fromEmail = process.env.TAFMUN_FROM_EMAIL || 'Aurora Forum <onboarding@resend.dev>';

  if (!apiKey || !recipient) {
    console.error('Missing environment variables: RESEND_API_KEY or TAFMUN_RECIPIENT_EMAIL');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [recipient],
      subject: `TAFMUN Registration – ${fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color:#6b3fa4;">New TAFMUN Registration</h2>
          <hr style="border:1px solid #e0e0e0" />
          <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Full Name</strong></td><td style="padding:8px; border:1px solid #ddd;">${fullName}</td></tr>
            <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Grade</strong></td><td style="padding:8px; border:1px solid #ddd;">${grade}</td></tr>
            <tr><td style="padding:8px; border:1px solid #ddd;"><strong>School / College</strong></td><td style="padding:8px; border:1px solid #ddd;">${school}</td></tr>
            <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Committee</strong></td><td style="padding:8px; border:1px solid #ddd;">${committee}</td></tr>
          </table>
          <p style="margin-top:16px; font-size:14px;">Registration fee: <strong>Rs. 2,200</strong> (payment proof attached)</p>
          <p style="font-size:12px; color:#888;">This email was generated from the TAFMUN registration page on the Aurora Forum website.</p>
        </div>
      `,
      attachments: [
        {
          filename: `payment_proof_${Date.now()}.${paymentProofMime.split('/')[1]}`,
          content: paymentProofBase64
        }
      ]
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
    }

    console.log('Email sent:', data?.id);
    return res.status(200).json({ message: 'Registration submitted successfully' });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}