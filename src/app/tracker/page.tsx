'use client';
import { useEffect, useState } from 'react';

interface TrackerRow {
  contact_id: number;
  company_name: string;
  email: string;
  contact_name: string | null;
  sent_email_id: number;
  subject: string;
  original_body: string;
  sent_at: string;
  status: string;
  reply_count: number;
}

interface Reply {
  id: number;
  contact_id: number;
  company_name: string;
  contact_email: string;
  contact_name: string | null;
  from_email: string;
  subject: string | null;
  body: string;
  received_at: string;
  original_subject: string | null;
}

interface LogForm {
  contact_id: string;
  sent_email_id: string;
  from_email: string;
  subject: string;
  body: string;
}

interface FollowUp {
  row: TrackerRow;
  subject: string;
  body: string;
  generating: boolean;
  sending: boolean;
  error: string;
  sent: boolean;
}

function daysSince(dateStr: string) {
  const sent = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24));
}

const inputCls = 'w-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500';

export default function TrackerPage() {
  const [rows, setRows] = useState<TrackerRow[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [tab, setTab] = useState<'sent' | 'replies'>('sent');
  const [showLog, setShowLog] = useState(false);
  const [logForm, setLogForm] = useState<LogForm>({ contact_id: '', sent_email_id: '', from_email: '', subject: '', body: '' });
  const [logging, setLogging] = useState(false);
  const [contacts, setContacts] = useState<{ id: number; company_name: string; email: string }[]>([]);
  const [followUp, setFollowUp] = useState<FollowUp | null>(null);

  async function load() {
    const [t, r, c] = await Promise.all([
      fetch('/api/tracker').then((x) => x.json()),
      fetch('/api/replies').then((x) => x.json()),
      fetch('/api/contacts').then((x) => x.json()),
    ]);
    setRows(t);
    setReplies(r);
    setContacts(c);
  }

  useEffect(() => { load(); }, []);

  async function logReply(e: React.FormEvent) {
    e.preventDefault();
    setLogging(true);
    await fetch('/api/replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: Number(logForm.contact_id),
        sent_email_id: logForm.sent_email_id ? Number(logForm.sent_email_id) : null,
        from_email: logForm.from_email,
        subject: logForm.subject || null,
        body: logForm.body,
      }),
    });
    setLogForm({ contact_id: '', sent_email_id: '', from_email: '', subject: '', body: '' });
    setShowLog(false);
    setLogging(false);
    load();
  }

  async function openFollowUp(row: TrackerRow) {
    const draft: FollowUp = { row, subject: '', body: '', generating: true, sending: false, error: '', sent: false };
    setFollowUp(draft);
    const res = await fetch('/api/generate-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: row.company_name,
        contact_name: row.contact_name,
        original_subject: row.subject,
        original_body: row.original_body,
        days_since_sent: daysSince(row.sent_at),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFollowUp((f) => f ? { ...f, generating: false, error: data.error ?? 'Generation failed' } : null);
    } else {
      setFollowUp((f) => f ? { ...f, generating: false, subject: data.subject, body: data.body } : null);
    }
  }

  async function sendFollowUp() {
    if (!followUp) return;
    setFollowUp((f) => f ? { ...f, sending: true, error: '' } : null);
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: followUp.row.contact_id,
        subject: followUp.subject,
        body: followUp.body,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFollowUp((f) => f ? { ...f, sending: false, error: data.error ?? 'Send failed' } : null);
    } else {
      setFollowUp((f) => f ? { ...f, sending: false, sent: true } : null);
      load();
    }
  }

  const sentForContact = rows.filter((r) => String(r.contact_id) === logForm.contact_id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tracker</h1>
        <button type="button" onClick={() => setShowLog((s) => !s)}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors">
          + Log a Reply
        </button>
      </div>

      {showLog && (
        <div className="bg-white dark:bg-zinc-900 border border-orange-500/40 rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-zinc-300">Log Incoming Reply</h2>
          <form onSubmit={logReply} className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="log-company" className="text-gray-400 dark:text-zinc-500 text-xs block mb-1">Company *</label>
                <select id="log-company" title="Company" required value={logForm.contact_id}
                  onChange={(e) => setLogForm((f) => ({ ...f, contact_id: e.target.value, sent_email_id: '' }))}
                  className={inputCls}>
                  <option value="">— Select —</option>
                  {contacts.map((c) => <option key={c.id} value={c.id}>{c.company_name} ({c.email})</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="log-email" className="text-gray-400 dark:text-zinc-500 text-xs block mb-1">Linked to email (optional)</label>
                <select id="log-email" title="Linked email" value={logForm.sent_email_id}
                  onChange={(e) => setLogForm((f) => ({ ...f, sent_email_id: e.target.value }))}
                  className={inputCls}>
                  <option value="">— None —</option>
                  {sentForContact.map((s) => <option key={s.sent_email_id} value={s.sent_email_id}>{s.subject} ({s.sent_at.slice(0, 10)})</option>)}
                </select>
              </div>
            </div>
            <input required placeholder="From email *" value={logForm.from_email}
              onChange={(e) => setLogForm((f) => ({ ...f, from_email: e.target.value }))}
              className={inputCls} />
            <input placeholder="Reply subject (optional)" value={logForm.subject}
              onChange={(e) => setLogForm((f) => ({ ...f, subject: e.target.value }))}
              className={inputCls} />
            <textarea required placeholder="Reply body *" value={logForm.body}
              onChange={(e) => setLogForm((f) => ({ ...f, body: e.target.value }))}
              rows={5}
              className={`${inputCls} resize-none`} />
            <div className="flex gap-3">
              <button type="submit" disabled={logging}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors">
                {logging ? 'Saving…' : 'Save Reply'}
              </button>
              <button type="button" onClick={() => setShowLog(false)}
                className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Follow-up panel */}
      {followUp && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">Follow-up Email</h2>
                <p className="text-gray-400 dark:text-zinc-500 text-sm">{followUp.row.company_name} · {followUp.row.email}</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setFollowUp(null)} className="text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white text-xl leading-none">✕</button>
            </div>

            {followUp.generating ? (
              <div className="py-10 text-center text-gray-400 dark:text-zinc-400 text-sm animate-pulse">Generating follow-up…</div>
            ) : followUp.sent ? (
              <div className="py-10 text-center text-green-600 dark:text-green-400 text-sm">
                Follow-up sent and logged to the tracker.
                <button type="button" onClick={() => setFollowUp(null)} className="block mx-auto mt-4 text-gray-400 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white text-xs">Close</button>
              </div>
            ) : (
              <>
                {followUp.error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3 text-red-600 dark:text-red-300 text-sm">{followUp.error}</div>}
                <div>
                  <label htmlFor="fu-subject" className="text-gray-400 dark:text-zinc-500 text-xs block mb-1">Subject</label>
                  <input id="fu-subject" placeholder="Follow-up subject" value={followUp.subject}
                    onChange={(e) => setFollowUp((f) => f ? { ...f, subject: e.target.value } : null)}
                    className={inputCls} />
                </div>
                <div>
                  <label htmlFor="fu-body" className="text-gray-400 dark:text-zinc-500 text-xs block mb-1">Body</label>
                  <textarea id="fu-body" placeholder="Follow-up body" value={followUp.body}
                    onChange={(e) => setFollowUp((f) => f ? { ...f, body: e.target.value } : null)}
                    rows={14}
                    className={`${inputCls} resize-none font-mono leading-relaxed`} />
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => openFollowUp(followUp.row)}
                    className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors px-3 py-2">
                    ↺ Regenerate
                  </button>
                  <button type="button" onClick={sendFollowUp} disabled={followUp.sending || !followUp.subject || !followUp.body}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold rounded-lg px-5 py-2 text-sm transition-colors">
                    {followUp.sending ? 'Sending…' : 'Send Follow-up →'}
                  </button>
                </div>
                <div className="border-t border-gray-200 dark:border-zinc-800 pt-3">
                  <p className="text-gray-300 dark:text-zinc-600 text-xs">Original sent {daysSince(followUp.row.sent_at)} day(s) ago · &quot;{followUp.row.subject}&quot;</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-1 w-fit">
        {(['sent', 'replies'] as const).map((t) => (
          <button type="button" key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}`}>
            {t === 'sent' ? `Sent (${rows.length})` : `Replies (${replies.length})`}
          </button>
        ))}
      </div>

      {tab === 'sent' ? (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-8 text-gray-400 dark:text-zinc-500 text-sm text-center">No emails sent yet. Go to Compose to send your first pitch.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 dark:text-zinc-500 text-xs uppercase border-b border-gray-200 dark:border-zinc-800">
                  <tr>
                    <th className="text-left px-5 py-3">Company</th>
                    <th className="text-left px-5 py-3">Email</th>
                    <th className="text-left px-5 py-3">Subject</th>
                    <th className="text-left px-5 py-3">Sent</th>
                    <th className="text-left px-5 py-3">Replies</th>
                    <th className="px-5 py-3" aria-label="Actions"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {rows.map((r) => (
                    <tr key={r.sent_email_id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-5 py-3 font-medium">{r.company_name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-zinc-400">{r.email}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-zinc-300 max-w-xs truncate">{r.subject}</td>
                      <td className="px-5 py-3 text-gray-400 dark:text-zinc-500 whitespace-nowrap">
                        <div>{r.sent_at.slice(0, 10)}</div>
                        <div className="text-gray-300 dark:text-zinc-600 text-xs">{daysSince(r.sent_at)}d ago</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold ${r.reply_count > 0 ? 'text-orange-500' : 'text-gray-300 dark:text-zinc-600'}`}>
                          {r.reply_count > 0 ? `${r.reply_count} repl.` : 'No reply'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button type="button" onClick={() => openFollowUp(r)}
                          className="text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors whitespace-nowrap">
                          ↩ Follow-up
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {replies.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-8 text-gray-400 dark:text-zinc-500 text-sm text-center">
              No replies logged yet. Click &quot;+ Log a Reply&quot; to record an incoming response.
            </div>
          ) : (
            replies.map((r) => (
              <div key={r.id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-semibold">{r.company_name}</span>
                    <span className="text-gray-400 dark:text-zinc-500 text-sm ml-2">from {r.from_email}</span>
                  </div>
                  <span className="text-gray-300 dark:text-zinc-600 text-xs">{r.received_at.slice(0, 16).replace('T', ' ')}</span>
                </div>
                {r.subject && <div className="text-gray-500 dark:text-zinc-400 text-sm mb-2">Re: {r.subject}</div>}
                {r.original_subject && <div className="text-gray-300 dark:text-zinc-600 text-xs mb-2">In response to: {r.original_subject}</div>}
                <div className="text-gray-700 dark:text-zinc-300 text-sm whitespace-pre-wrap bg-gray-50 dark:bg-zinc-800 rounded-lg p-3">{r.body}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
