import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import getDb from '@/lib/db';

export async function POST(request: NextRequest) {
  const db = getDb();
  const { contact_id, subject, body } = await request.json();

  // DB settings override env vars
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const dbCfg: Record<string, string> = {};
  for (const s of rows) dbCfg[s.key] = s.value;

  const smtpHost = dbCfg.smtp_host || process.env.SMTP_HOST;
  const smtpPort = Number(dbCfg.smtp_port || process.env.SMTP_PORT || 587);
  const smtpSecure = (dbCfg.smtp_secure || process.env.SMTP_SECURE || 'false') === 'true';
  const smtpUser = dbCfg.smtp_user || process.env.SMTP_USER;
  const smtpPassword = dbCfg.smtp_password || process.env.SMTP_PASSWORD;

  if (!smtpHost || !smtpUser || !smtpPassword) {
    return NextResponse.json({ error: 'SMTP not configured. Check Settings or .env.local.' }, { status: 400 });
  }

  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contact_id) as {
    id: number; company_name: string; email: string; contact_name: string | null;
  } | undefined;

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
    subject,
    text: body,
  });

  const result = db.prepare(
    'INSERT INTO sent_emails (contact_id, subject, body) VALUES (?, ?, ?)'
  ).run(contact_id, subject, body);

  return NextResponse.json({ ok: true, sent_email_id: result.lastInsertRowid });
}
