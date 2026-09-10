import { Resend } from 'resend';

/**
 * TAFMUN Registration handler.
 *
 * Body must include `registrationType`:
 *   - "standard" : Conventional committee registration (PKR 2,200)
 *   - "special"  : The War of the Five Kings — Fictional Crisis Committee (PKR 2,400)
 *
 * Common fields: fullName, phoneNumber, grade, school,
 *                paymentProofBase64, paymentProofMime
 * Standard-only: firstPriority, secondPriority, thirdPriority
 * Special-only:  email, watchedGoT, westerosFamiliarity, crisisBefore,
 *                crisisExperience, munExperience
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const registrationType = body.registrationType === 'special' ? 'special' : 'standard';

  const {
    fullName, phoneNumber, grade, school,
    paymentProofBase64, paymentProofMime
  } = body;

  if (!fullName || !phoneNumber || !grade || !school) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!paymentProofBase64 || !paymentProofMime) {
    return res.status(400).json({ error: 'Payment screenshot is required' });
  }
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(paymentProofMime)) {
    return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG or WEBP are allowed.' });
  }

  let subject;
  let html;

  if (registrationType === 'standard') {
    const { firstPriority, secondPriority, thirdPriority } = body;
    if (!firstPriority || !secondPriority || !thirdPriority) {
      return res.status(400).json({ error: 'All three committee priorities are required.' });
    }
    if (new Set([firstPriority, secondPriority, thirdPriority]).size !== 3) {
      return res.status(400).json({ error: 'Committee priorities must be different.' });
    }
    subject = `TAFMUN Registration – ${fullName}`;
    html = renderStandardEmail({
      fullName, phoneNumber, grade, school,
      firstPriority, secondPriority, thirdPriority
    });
  } else {
    const {
      email, watchedGoT, westerosFamiliarity, crisisBefore,
      crisisExperience, munExperience
    } = body;

    if (!email || !watchedGoT || !westerosFamiliarity || !crisisBefore || !munExperience) {
      return res.status(400).json({ error: 'Missing required special registration fields.' });
    }
    if (crisisBefore === 'Yes' && !crisisExperience) {
      return res.status(400).json({ error: 'Crisis Committee experience details are required.' });
    }

    subject = `TAFMUN — Special Registration — The War of the Five Kings — ${fullName}`;
    html = renderSpecialEmail({
      fullName, email, phoneNumber, grade, school,
      watchedGoT, westerosFamiliarity, crisisBefore,
      crisisExperience, munExperience
    });
  }

  const apiKey    = process.env.RESEND_API_KEY;
  const recipient = process.env.TAFMUN_RECIPIENT_EMAIL;
  const fromEmail = process.env.TAFMUN_FROM_EMAIL || 'Aurora Forum <onboarding@resend.dev>';

  if (!apiKey || !recipient) {
    console.error('Missing env: RESEND_API_KEY or TAFMUN_RECIPIENT_EMAIL');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const resend = new Resend(apiKey);
  const ext = (paymentProofMime.split('/')[1] || 'png').replace('jpeg', 'jpg');

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [recipient],
      subject,
      html,
      attachments: [{
        filename: `payment_proof_${Date.now()}.${ext}`,
        content: paymentProofBase64
      }]
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
    }

    console.log(`[TAFMUN ${registrationType}] Email sent:`, data?.id);
    return res.status(200).json({ message: 'Registration submitted successfully' });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─── Helpers ─────────────────────────────────────────────── */

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function row(label, value) {
  return `<tr>
    <td style="padding:8px; border:1px solid #ddd;"><strong>${esc(label)}</strong></td>
    <td style="padding:8px; border:1px solid #ddd;">${esc(value)}</td>
  </tr>`;
}

function sectionTitle(t) {
  return `<h3 style="color:#7b3fc4; font-family:Arial,sans-serif; margin:24px 0 8px; font-size:15px; letter-spacing:0.06em; text-transform:uppercase;">${esc(t)}</h3>`;
}

function table(rows) {
  return `<table style="width:100%; border-collapse:collapse; font-family:Arial,sans-serif; font-size:13px;">${rows}</table>`;
}

const BANK = {
  fee: 'PKR 2,200',
  title: 'Rizwan Haider',
  bank: 'Soneri Bank',
  account: '20004814507'
};
const SPECIAL_BANK = {
  fee: 'PKR 2,400',
  title: 'Rizwan Haider',
  bank: 'Soneri Bank',
  account: '20004814507'
};

function renderStandardEmail(d) {
  return `
    <div style="font-family:Arial, sans-serif; max-width:640px; margin:0 auto; color:#111;">
      <h2 style="color:#7b3fc4;">TAFMUN — Standard Registration</h2>
      <hr style="border:1px solid #e0e0e0" />
      ${sectionTitle('Registration Information')}
      ${table(
        row('Full Name', d.fullName) +
        row('Phone', d.phoneNumber) +
        row('Grade', d.grade) +
        row('School / College', d.school)
      )}
      ${sectionTitle('Committee Preferences')}
      ${table(
        row('1st Committee Priority', d.firstPriority) +
        row('2nd Committee Priority', d.secondPriority) +
        row('3rd Committee Priority', d.thirdPriority)
      )}
      ${sectionTitle('Payment Details')}
      ${table(
        row('Registration Fee', BANK.fee) +
        row('Account Title', BANK.title) +
        row('Bank', BANK.bank) +
        row('Account Number', BANK.account)
      )}
      <p style="margin-top:20px; font-size:12px; color:#888;">Generated from the TAFMUN registration page on the Aurora Forum website.</p>
    </div>
  `;
}

function renderSpecialEmail(d) {
  return `
    <div style="font-family:Arial, sans-serif; max-width:660px; margin:0 auto; color:#111;">
      <h2 style="color:#7b3fc4;">TAFMUN — Special Registration</h2>
      <p style="font-size:14px; color:#555; margin-top:-4px;">
        <strong>The War of the Five Kings</strong> — Fictional Crisis Committee
      </p>
      <hr style="border:1px solid #e0e0e0" />

      ${sectionTitle('Registration Information')}
      ${table(
        row('Full Name', d.fullName) +
        row('Email', d.email) +
        row('Phone Number', d.phoneNumber) +
        row('Grade', d.grade) +
        row('School / College', d.school)
      )}

      ${sectionTitle('Special Committee')}
      ${table(
        row('Committee', 'THE WAR OF THE FIVE KINGS') +
        row('Committee Type', 'Fictional Crisis Committee') +
        row('Fee', 'PKR 2,400')
      )}

      ${sectionTitle('GOT Familiarity')}
      ${table(
        row('Have you watched Game of Thrones?', d.watchedGoT) +
        row('Westeros familiarity', d.westerosFamiliarity) +
        row('Participated in a Crisis Committee before?', d.crisisBefore) +
        (d.crisisBefore === 'Yes' ? row('Crisis Committee experience', d.crisisExperience || '—') : '') +
        row('MUN experience', d.munExperience)
      )}

      ${sectionTitle('Payment Details')}
      ${table(
        row('Registration Fee', SPECIAL_BANK.fee) +
        row('Account Title', SPECIAL_BANK.title) +
        row('Bank', SPECIAL_BANK.bank) +
        row('Account Number', SPECIAL_BANK.account)
      )}

      <p style="margin-top:20px; font-size:12px; color:#888;">Generated from the TAFMUN Special Registration form on the Aurora Forum website.</p>
    </div>
  `;
}