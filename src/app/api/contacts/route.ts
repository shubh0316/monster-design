import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const db = await getDb();
    const contacts = await db.collection('contacts').aggregate([
      {
        $lookup: {
          from: 'sent_emails',
          localField: '_id',
          foreignField: 'contact_id',
          as: 'sent',
        },
      },
      {
        $lookup: {
          from: 'replies',
          localField: '_id',
          foreignField: 'contact_id',
          as: 'repl',
        },
      },
      {
        $project: {
          company_name: 1,
          email: 1,
          contact_name: 1,
          notes: 1,
          created_at: 1,
          emails_sent: { $size: '$sent' },
          replies_count: { $size: '$repl' },
        },
      },
      { $sort: { created_at: -1 } },
    ]).toArray();

    return NextResponse.json(contacts.map((c) => ({ ...c, id: c._id.toString() })));
  } catch (err) {
    console.error('GET /api/contacts error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const col = db.collection('contacts');

    if (Array.isArray(body)) {
      let inserted = 0;
      for (const row of body) {
        if (!row.email) continue;
        try {
          await col.insertOne({
            company_name: row.company_name || row.email.split('@')[1]?.split('.')[0] || row.email,
            email: row.email.toLowerCase().trim(),
            contact_name: row.contact_name ?? null,
            notes: row.notes ?? null,
            created_at: new Date(),
          });
          inserted++;
        } catch {
          // duplicate email — skip
        }
      }
      return NextResponse.json({ inserted });
    }

    const { company_name, email, contact_name, notes } = body;
    try {
      const result = await col.insertOne({
        company_name,
        email: email.toLowerCase().trim(),
        contact_name: contact_name ?? null,
        notes: notes ?? null,
        created_at: new Date(),
      });
      return NextResponse.json({ id: result.insertedId.toString() });
    } catch {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
  } catch (err) {
    console.error('POST /api/contacts error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await db.collection('contacts').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/contacts error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
