'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/contacts', label: 'Contacts' },
  { href: '/compose', label: 'Compose' },
  { href: '/tracker', label: 'Tracker' },
  { href: '/settings', label: 'Settings' },
];

export default function Nav() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    setDark(isDark);
  }

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center gap-8">
      <div className="flex items-center gap-2 mr-4">
        <span className="text-orange-500 font-black text-xl tracking-tight">MONSTER</span>
        <span className="text-gray-900 dark:text-white font-light text-xl tracking-tight">DESIGN</span>
      </div>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`text-sm font-medium transition-colors ${
            pathname === l.href
              ? 'text-orange-500'
              : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {l.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="ml-auto text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors text-lg leading-none"
      >
        {dark ? '☀️' : '🌙'}
      </button>
    </nav>
  );
}
