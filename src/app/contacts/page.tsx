'use client';
import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

interface Contact {
  id: number;
  company_name: string;
  email: string;
  contact_name: string | null;
  notes: string | null;
  emails_sent: number;
  replies_count: number;
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ company_name: '', email: '', contact_name: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [csvError, setCsvError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const data = await fetch('/api/contacts').then((r) => r.json());
    setContacts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ company_name: '', email: '', contact_name: '', notes: '' });
    setSaving(false);
    load();
  }

  async function deleteContact(id: number) {
    await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' });
    load();
  }

  function parseExcel(buffer: ArrayBuffer): { company_name: string; email: string; contact_name: string; notes: string }[] {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
    if (rawRows.length === 0) throw new Error('No data found in the Excel file');

    // Normalize headers to find company and email columns
    const firstRow = rawRows[0];
    const headers = Object.keys(firstRow);
    const find = (keywords: string[]) =>
      headers.find((h) => keywords.some((k) => h.toLowerCase().includes(k))) ?? '';

    const companyCol = find(['company', 'business', 'org']);
    const emailCol = find(['email', 'e-mail', 'mail']);
    const contactCol = find(['contact', 'person', 'name', 'first']);
    const notesCol = find(['note', 'remark', 'comment']);

    if (!emailCol) throw new Error('Could not find an email column. Make sure a column header contains "email".');

    return rawRows
      .map((row) => ({
        company_name: companyCol ? String(row[companyCol] ?? '').trim() : '',
        email: String(row[emailCol] ?? '').trim(),
        contact_name: contactCol ? String(row[contactCol] ?? '').trim() : '',
        notes: notesCol ? String(row[notesCol] ?? '').trim() : '',
      }))
      .filter((r) => r.email && r.email.includes('@'));
  }

  async function handleExcel(e: React.ChangeEvent<HTMLInputElement>) {
    setCsvError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    try {
      const rows = parseExcel(buffer);
      if (rows.length === 0) {
        setCsvError('No valid email addresses found in the file.');
        return;
      }
      const res = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rows) });
      const data = await res.json();
      alert(`Imported ${data.inserted} contacts from ${rows.length} rows.`);
      load();
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : 'Failed to parse Excel file');
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Contacts</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Add single contact */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-semibold mb-4 text-zinc-300">Add Contact</h2>
          <form onSubmit={addContact} className="space-y-3">
            <input required placeholder="Company Name *" value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
            <input required type="email" placeholder="Email Address *" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
            <input placeholder="Contact Name (optional)" value={form.contact_name}
              onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
            <input placeholder="Notes (optional)" value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
            <button disabled={saving} type="submit"
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors">
              {saving ? 'Adding…' : 'Add Contact'}
            </button>
          </form>
        </div>

        {/* Excel import */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-semibold mb-2 text-zinc-300">Import Excel File</h2>
          <p className="text-zinc-500 text-sm mb-4">
            Upload a <code className="text-orange-400">.xlsx</code> or <code className="text-orange-400">.xls</code> file.
            The app will auto-detect columns containing <span className="text-zinc-300">email</span> and <span className="text-zinc-300">company</span>.
          </p>
          <label className="cursor-pointer inline-block bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-4 py-2 text-sm transition-colors">
            Choose Excel File
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcel} />
          </label>
          {csvError && <p className="text-red-400 text-sm mt-3">{csvError}</p>}
          <p className="text-zinc-600 text-xs mt-4">Duplicate emails are automatically skipped.</p>
        </div>
      </div>

      {/* Contact table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center">
          <span className="font-semibold text-zinc-300">{contacts.length} Contacts</span>
        </div>
        {loading ? (
          <div className="p-8 text-zinc-500 text-sm text-center">Loading…</div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-zinc-500 text-sm text-center">No contacts yet. Add one above or import a CSV.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-zinc-500 text-xs uppercase border-b border-zinc-800">
                <tr>
                  <th className="text-left px-5 py-3">Company</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Contact</th>
                  <th className="text-left px-5 py-3">Sent</th>
                  <th className="text-left px-5 py-3">Replies</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-5 py-3 font-medium">{c.company_name}</td>
                    <td className="px-5 py-3 text-zinc-400">{c.email}</td>
                    <td className="px-5 py-3 text-zinc-400">{c.contact_name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${c.emails_sent > 0 ? 'text-green-400' : 'text-zinc-600'}`}>
                        {c.emails_sent > 0 ? `${c.emails_sent} sent` : 'Not sent'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${c.replies_count > 0 ? 'text-orange-400' : 'text-zinc-600'}`}>
                        {c.replies_count > 0 ? `${c.replies_count} repl.` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => deleteContact(c.id)}
                        className="text-zinc-600 hover:text-red-400 text-xs transition-colors">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
