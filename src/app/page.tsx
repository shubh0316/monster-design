'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  total_contacts: number;
  emails_sent: number;
  replies: number;
  pending: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [contacts, tracker, replies] = await Promise.all([
        fetch('/api/contacts').then((r) => r.json()),
        fetch('/api/tracker').then((r) => r.json()),
        fetch('/api/replies').then((r) => r.json()),
      ]);
      const total_contacts = contacts.length;
      const emails_sent = tracker.length;
      const repliesCount = replies.length;
      const contactsWithEmail = new Set(tracker.map((t: { contact_id: number }) => t.contact_id));
      const pending = contacts.filter((c: { id: number }) => !contactsWithEmail.has(c.id)).length;
      setStats({ total_contacts, emails_sent, replies: repliesCount, pending });
    }
    load();
  }, []);

  const cards = [
    { label: 'Total Contacts', value: stats?.total_contacts ?? '—', color: 'text-blue-400', link: '/contacts' },
    { label: 'Emails Sent', value: stats?.emails_sent ?? '—', color: 'text-green-400', link: '/tracker' },
    { label: 'Replies Received', value: stats?.replies ?? '—', color: 'text-orange-400', link: '/tracker' },
    { label: 'Not Yet Contacted', value: stats?.pending ?? '—', color: 'text-yellow-400', link: '/contacts' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-zinc-400 mb-8 text-sm">Track your outreach for Monster Design branding & packaging pitches.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <Link key={c.label} href={c.link} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors">
            <div className={`text-3xl font-black ${c.color}`}>{c.value}</div>
            <div className="text-zinc-400 text-sm mt-1">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/contacts" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-orange-500 transition-colors group">
          <div className="text-lg font-semibold mb-1 group-hover:text-orange-400 transition-colors">Manage Contacts</div>
          <div className="text-zinc-500 text-sm">Import a CSV or add company emails one by one.</div>
        </Link>
        <Link href="/compose" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-orange-500 transition-colors group">
          <div className="text-lg font-semibold mb-1 group-hover:text-orange-400 transition-colors">Compose & Send</div>
          <div className="text-zinc-500 text-sm">AI-written pitch emails, reviewed before sending.</div>
        </Link>
        <Link href="/tracker" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-orange-500 transition-colors group">
          <div className="text-lg font-semibold mb-1 group-hover:text-orange-400 transition-colors">Track Replies</div>
          <div className="text-zinc-500 text-sm">See who replied and log incoming responses.</div>
        </Link>
      </div>
    </div>
  );
}
