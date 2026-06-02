import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.collection('sent_emails').aggregate([
      {
        $lookup: {
          from: 'contacts',
          localField: 'contact_id',
          foreignField: '_id',
          as: 'contact',
        },
      },
      { $unwind: '$contact' },
      {
        $lookup: {
          from: 'replies',
          localField: 'contact_id',
          foreignField: 'contact_id',
          as: 'repl',
        },
      },
      {
        $project: {
          contact_id: 1,
          company_name: '$contact.company_name',
          email: '$contact.email',
          contact_name: '$contact.contact_name',
          subject: 1,
          original_body: '$body',
          sent_at: 1,
          status: 1,
          reply_count: { $size: '$repl' },
        },
      },
      { $sort: { sent_at: -1 } },
    ]).toArray();

    return NextResponse.json(rows.map((r) => ({
      ...r,
      sent_email_id: r._id.toString(),
      contact_id: r.contact_id.toString(),
    })));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
