'use client';
import { useEffect, useState } from 'react';

interface SettingsForm {
  smtp_host: string;
  smtp_port: string;
  smtp_secure: string;
  smtp_user: string;
  smtp_password: string;
}

const inputCls = 'w-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500';

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    smtp_host: '',
    smtp_port: '587',
    smtp_secure: 'false',
    smtp_user: 'info@monster-design.com',
    smtp_password: '',
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((data) => {
      setForm((f) => ({
        ...f,
        smtp_host: data.smtp_host ?? f.smtp_host,
        smtp_port: data.smtp_port ?? f.smtp_port,
        smtp_secure: data.smtp_secure ?? f.smtp_secure,
        smtp_user: data.smtp_user ?? f.smtp_user,
        smtp_password: data.smtp_password ?? '',
      }));
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  const field = (key: keyof SettingsForm, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="text-gray-500 dark:text-zinc-400 text-sm block mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className={inputCls}
      />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-gray-400 dark:text-zinc-500 text-sm mb-8">Configure your email sending credentials. AI (Groq) and SMTP are pre-configured via environment variables.</p>

      <div className="bg-white dark:bg-zinc-900 border border-green-500/40 rounded-xl p-4 mb-6 text-sm">
        <div className="text-green-600 dark:text-green-400 font-medium mb-1">✓ Groq AI configured</div>
        <div className="text-gray-400 dark:text-zinc-500 text-xs">Email generation is active using your Groq API key from the environment.</div>
      </div>

      <form onSubmit={save} className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 dark:text-zinc-300">Email — SMTP</h2>
          <p className="text-gray-400 dark:text-zinc-500 text-sm">Emails will be sent from <span className="text-orange-500">info@monster-design.com</span>. Enter your SMTP credentials below.</p>
          {field('smtp_host', 'SMTP Host', 'text', 'e.g. smtp.gmail.com or mail.monster-design.com')}
          <div className="grid grid-cols-2 gap-3">
            {field('smtp_port', 'SMTP Port', 'text', '587')}
            <div>
              <label className="text-gray-500 dark:text-zinc-400 text-sm block mb-1">Secure (SSL/TLS)</label>
              <select value={form.smtp_secure}
                title="Secure (SSL/TLS)"
                onChange={(e) => setForm((f) => ({ ...f, smtp_secure: e.target.value }))}
                className={inputCls}>
                <option value="false">No (STARTTLS / port 587)</option>
                <option value="true">Yes (SSL / port 465)</option>
              </select>
            </div>
          </div>
          {field('smtp_user', 'SMTP Username / From Address', 'email')}
          {field('smtp_password', 'SMTP Password or App Password', 'password', '••••••••')}
          <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 text-xs text-gray-400 dark:text-zinc-500 space-y-1">
            <div className="text-gray-600 dark:text-zinc-400 font-medium mb-1">Common setups:</div>
            <div>Gmail: host = smtp.gmail.com, port = 587, use an App Password (not your Google password)</div>
            <div>cPanel/Hosting: host = mail.monster-design.com, port = 587, password = email account password</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {saved && <span className="text-green-600 dark:text-green-400 text-sm">Settings saved!</span>}
        </div>
      </form>
    </div>
  );
}
