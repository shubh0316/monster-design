import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not set in environment.' }, { status: 400 });
  }

  const { company_name, contact_name } = await request.json();
  const client = new Groq({ apiKey });
  const contactGreeting = contact_name ? `Hi ${contact_name},` : 'Hello,';

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are writing a cold outreach email on behalf of Monster Design, a branding and packaging design studio based in Canada.

Write a polite, warm, professional email to ${company_name}${contact_name ? ` (contact: ${contact_name})` : ''} pitching Monster Design's branding and packaging design services.

Key details to include naturally:
- Monster Design website: monster-design.com
- Portfolio: https://www.behance.net/monster_design_
- Sending from: info@monster-design.com
- Focus: company branding, packaging design
- Tone: warm, respectful, Canadian politeness — not pushy, never aggressive
- Keep it concise (3-4 short paragraphs max)
- End with a gentle call to action (e.g., a quick call or to check the portfolio)

Return ONLY the email content in this exact JSON format with no extra text:
{
  "subject": "email subject line here",
  "body": "full email body here with \\n for line breaks"
}

Start the body with: ${contactGreeting}`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ subject: parsed.subject, body: parsed.body });
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 });
  }
}
