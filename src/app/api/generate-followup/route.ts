import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not set in environment.' }, { status: 400 });
  }

  const { company_name, contact_name, original_subject, original_body, days_since_sent } = await request.json();
  const client = new Groq({ apiKey });
  const contactGreeting = contact_name ? `Hi ${contact_name},` : 'Hello,';

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `You are writing a polite follow-up email on behalf of Monster Design, a branding and packaging design studio in Canada.

Context:
- Recipient company: ${company_name}${contact_name ? ` (contact: ${contact_name})` : ''}
- Original email subject: "${original_subject}"
- Days since original email was sent: ${days_since_sent ?? 'a few'}
- Original email body:
${original_body}

Write a SHORT, friendly follow-up email (2-3 paragraphs max). Rules:
- Acknowledge you sent an email previously and didn't want it to get lost
- Do NOT be pushy or repeat the full pitch — just a gentle nudge
- Keep Canadian politeness — warm, respectful, never aggressive
- Mention portfolio link naturally if appropriate: https://www.behance.net/monster_design_
- End with an easy, low-pressure call to action

CRITICAL — spam filter rules:
- NEVER use: "free", "guarantee", "limited time", "act now", "click here", "special offer", "urgent", "incredible", "winner"
- No all-caps words, no excessive exclamation marks
- Write like a real person, not a marketing template
- Subject line must be natural, not clickbait

Return ONLY this JSON with no extra text:
{
  "subject": "Re: ${original_subject}",
  "body": "full follow-up body with \\n for line breaks"
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
