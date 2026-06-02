import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      c.id as contact_id,
      c.company_name,
      c.email,
      c.contact_name,
      se.id as sent_email_id,
      se.subject,
      se.body as original_body,
      se.sent_at,
      se.status,
      COUNT(r.id) as reply_count
    FROM contacts c
    LEFT JOIN sent_emails se ON se.contact_id = c.id
    LEFT JOIN replies r ON r.contact_id = c.id
    WHERE se.id IS NOT NULL
    GROUP BY se.id
    ORDER BY se.sent_at DESC
  `).all();
  return NextResponse.json(rows);
}
