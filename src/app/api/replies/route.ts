import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const db = await getDb();
    const replies = await db.collection('replies').aggregate([
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
          from: 'sent_emails',
          localField: 'sent_email_id',
          foreignField: '_id',
          as: 'original',
        },
      },
      {
        $project: {
          from_email: 1,
          subject: 1,
          body: 1,
          received_at: 1,
          contact_id: 1,
          company_name: '$contact.company_name',
          contact_email: '$contact.email',
          contact_name: '$contact.contact_name',
          original_subject: { $arrayElemAt: ['$original.subject', 0] },
        },
      },
      { $sort: { received_at: -1 } },
    ]).toArray();

    return NextResponse.json(replies.map((r) => ({ ...r, id: r._id.toString() })));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const { sent_email_id, contact_id, from_email, subject, body } = await request.json();

    const result = await db.collection('replies').insertOne({
      sent_email_id: sent_email_id ? new ObjectId(sent_email_id) : null,
      contact_id: new ObjectId(contact_id),
      from_email,
      subject: subject ?? null,
      body,
      received_at: new Date(),
    });

    return NextResponse.json({ id: result.insertedId.toString() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
