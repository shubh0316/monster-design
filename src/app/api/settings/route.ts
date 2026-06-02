import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.collection('settings').find({}).toArray();
    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value;
    if (settings.smtp_password) settings.smtp_password = '***saved***';
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const col = db.collection('settings');
    for (const [key, value] of Object.entries(body)) {
      if (value && value !== '***saved***') {
        await col.updateOne({ key }, { $set: { key, value } }, { upsert: true });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
