import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const contacts = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM sent_emails WHERE contact_id = c.id) as emails_sent,
      (SELECT COUNT(*) FROM replies WHERE contact_id = c.id) as replies_count
    FROM contacts c
    ORDER BY c.created_at DESC
  `).all();
  return NextResponse.json(contacts);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  if (Array.isArray(body)) {
    const insert = db.prepare(
      'INSERT OR IGNORE INTO contacts (company_name, email, contact_name, notes) VALUES (?, ?, ?, ?)'
    );
    const insertMany = db.transaction((rows: typeof body) => {
      let inserted = 0;
      for (const row of rows) {
        const result = insert.run(row.company_name, row.email, row.contact_name ?? null, row.notes ?? null);
        if (result.changes > 0) inserted++;
      }
      return inserted;
    });
    const inserted = insertMany(body);
    return NextResponse.json({ inserted });
  }

  const { company_name, email, contact_name, notes } = body;
  const result = db.prepare(
    'INSERT OR IGNORE INTO contacts (company_name, email, contact_name, notes) VALUES (?, ?, ?, ?)'
  ).run(company_name, email, contact_name ?? null, notes ?? null);
  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function DELETE(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
