'use client';
import { useEffect, useState } from 'react';

interface Contact {
  id: string;
  company_name: string;
  email: string;
  contact_name: string | null;
  emails_sent: number;
}

const inputCls = 'w-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500';

export default function ComposePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/contacts').then((r) => r.json()).then(setContacts);
  }, []);

  const selected = contacts.find((c) => String(c.id) === selectedId);

  async function generate() {
    if (!selected) return;
    setGenerating(true);
    setError('');
    setSent(false);
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_name: selected.company_name, contact_name: selected.contact_name, email: selected.email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Generation failed');
    } else {
      setSubject(data.subject);
      setBody(data.body);
    }
    setGenerating(false);
  }

  async function send() {
    if (!selected || !subject || !body) return;
    setSending(true);
    setError('');
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: selected.id, subject, body }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Send failed');
    } else {
      setSent(true);
      setSubject('');
      setBody('');
      setSelectedId('');
      const updated = await fetch('/api/contacts').then((r) => r.json());
      setContacts(updated);
    }
    setSending(false);
  }

  const uncontacted = contacts.filter((c) => c.emails_sent === 0);
  const contacted = contacts.filter((c) => c.emails_sent > 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Compose & Send</h1>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Left panel */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
            <h2 className="font-semibold mb-3 text-gray-700 dark:text-zinc-300">Select Recipient</h2>
            <select
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setSent(false); setError(''); setSubject(''); setBody(''); }}
              className={inputCls}
            >
              <option value="">— Choose a contact —</option>
              {uncontacted.length > 0 && (
                <optgroup label="Not yet contacted">
                  {uncontacted.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name} ({c.email})</option>
                  ))}
                </optgroup>
              )}
              {contacted.length > 0 && (
                <optgroup label="Already contacted">
                  {contacted.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name} ({c.email})</option>
                  ))}
                </optgroup>
              )}
            </select>

            {selected && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg text-sm space-y-1">
                <div><span className="text-gray-400 dark:text-zinc-500">Company:</span> <span className="font-medium">{selected.company_name}</span></div>
                <div><span className="text-gray-400 dark:text-zinc-500">Email:</span> <span className="text-gray-600 dark:text-zinc-300">{selected.email}</span></div>
                {selected.contact_name && <div><span className="text-gray-400 dark:text-zinc-500">Contact:</span> <span className="text-gray-600 dark:text-zinc-300">{selected.contact_name}</span></div>}
                {selected.emails_sent > 0 && <div className="text-yellow-600 dark:text-yellow-500 text-xs pt-1">⚠ Already sent {selected.emails_sent} email(s) to this contact</div>}
              </div>
            )}

            <button
              type="button"
              onClick={generate}
              disabled={!selected || generating}
              className="mt-4 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
            >
              {generating ? 'Generating…' : '✨ Generate AI Email'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl p-4 text-red-600 dark:text-red-300 text-sm">{error}</div>
          )}
          {sent && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl p-4 text-green-700 dark:text-green-300 text-sm">
              Email sent successfully and logged to the tracker.
            </div>
          )}
        </div>

        {/* Right panel — email editor */}
        <div className="md:col-span-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-700 dark:text-zinc-300">Email Preview & Edit</h2>
          <div>
            <label className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-wide mb-1 block">From</label>
            <div className="text-sm text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 rounded-lg px-3 py-2">info@monster-design.com</div>
          </div>
          {selected && (
            <div>
              <label className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-wide mb-1 block">To</label>
              <div className="text-sm text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 rounded-lg px-3 py-2">{selected.email}</div>
            </div>
          )}
          <div>
            <label className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-wide mb-1 block">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject…"
              className={inputCls}
            />
          </div>
          <div className="flex-1">
            <label className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-wide mb-1 block">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email body will appear here after generation. You can edit it before sending."
              rows={16}
              className={`${inputCls} resize-none font-mono leading-relaxed`}
            />
          </div>
          <button
            type="button"
            onClick={send}
            disabled={!selected || !subject || !body || sending}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors self-end"
          >
            {sending ? 'Sending…' : 'Send Email →'}
          </button>
        </div>
      </div>
    </div>
  );
}
