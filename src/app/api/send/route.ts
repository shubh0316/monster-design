import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getDb } from '@/lib/db';
import { buildHtmlEmail } from '@/lib/email-html';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const { contact_id, subject, body } = await request.json();

    const settingsRows = await db.collection('settings').find({}).toArray();
    const cfg: Record<string, string> = {};
    for (const s of settingsRows) cfg[s.key] = s.value;

    const smtpHost = cfg.smtp_host || process.env.SMTP_HOST;
    const smtpPort = Number(cfg.smtp_port || process.env.SMTP_PORT || 587);
    const smtpSecure = (cfg.smtp_secure || process.env.SMTP_SECURE || 'false') === 'true';
    const smtpUser = cfg.smtp_user || process.env.SMTP_USER;
    const smtpPassword = cfg.smtp_password || process.env.SMTP_PASSWORD;

    if (!smtpHost || !smtpUser || !smtpPassword) {
      return NextResponse.json({ error: 'SMTP not configured. Check Settings or .env.local.' }, { status: 400 });
    }

    const contact = await db.collection('contacts').findOne({ _id: new ObjectId(contact_id) });
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPassword },
    });

    await transporter.sendMail({
      from: `Monster Design <${smtpUser}>`,
      to: contact.email,
      replyTo: smtpUser,
      subject,
      // Send both plain text and HTML — improves deliverability
      text: body,
      html: buildHtmlEmail(body),
      headers: {
        // Tells spam filters this is a one-to-one email, not a bulk blast
        'Precedence': 'personal',
        // Standard unsubscribe header — respected by Gmail, Outlook
        'List-Unsubscribe': `<mailto:${smtpUser}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Mailer': 'Monster Design Emailer',
      },
    });

    const result = await db.collection('sent_emails').insertOne({
      contact_id: new ObjectId(contact_id),
      subject,
      body,
      sent_at: new Date(),
      status: 'sent',
    });

    return NextResponse.json({ ok: true, sent_email_id: result.insertedId.toString() });
  } catch (err) {
    console.error('POST /api/send error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
