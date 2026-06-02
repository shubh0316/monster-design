'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/contacts', label: 'Contacts' },
  { href: '/compose', label: 'Compose' },
  { href: '/tracker', label: 'Tracker' },
  { href: '/settings', label: 'Settings' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center gap-8">
      <div className="flex items-center gap-2 mr-4">
        <span className="text-orange-500 font-black text-xl tracking-tight">MONSTER</span>
        <span className="text-white font-light text-xl tracking-tight">DESIGN</span>
      </div>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`text-sm font-medium transition-colors ${
            pathname === l.href
              ? 'text-orange-400'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
