import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const replies = db.prepare(`
    SELECT r.*, c.company_name, c.email as contact_email, c.contact_name,
      se.subject as original_subject
    FROM replies r
    JOIN contacts c ON r.contact_id = c.id
    LEFT JOIN sent_emails se ON r.sent_email_id = se.id
    ORDER BY r.received_at DESC
  `).all();
  return NextResponse.json(replies);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const { sent_email_id, contact_id, from_email, subject, body } = await request.json();

  const result = db.prepare(
    'INSERT INTO replies (sent_email_id, contact_id, from_email, subject, body) VALUES (?, ?, ?, ?, ?)'
  ).run(sent_email_id ?? null, contact_id, from_email, subject ?? null, body);

  return NextResponse.json({ id: result.lastInsertRowid });
}
