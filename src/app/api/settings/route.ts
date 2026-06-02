import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  // Never expose secrets — mask them
  if (settings.claude_api_key) settings.claude_api_key = '***saved***';
  if (settings.smtp_password) settings.smtp_password = '***saved***';
  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const save = db.transaction((data: Record<string, string>) => {
    for (const [key, value] of Object.entries(data)) {
      if (value && value !== '***saved***') upsert.run(key, value);
    }
  });
  save(body);
  return NextResponse.json({ ok: true });
}
