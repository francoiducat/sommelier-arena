import React from 'react';
import { useCurrentUrl } from '../../hooks/useCurrentUrl';

const DOCS_URL: string = (import.meta as any).env?.PUBLIC_DOCS_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? `http://localhost:3002/docs`
    : 'https://sommelier-arena.ducatillon.net/docs');

export function NavBar() {
  const currentUrl = useCurrentUrl();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  };

  return (
    <nav
      className="w-full bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 text-sm sticky top-0 z-10"
      aria-label="Main navigation"
    >
      {/* Logo / Home */}
      <a
        href="/"
        className="flex items-center gap-1.5 font-bold text-wine-600 hover:text-wine-800 transition-colors shrink-0"
        aria-label="Sommelier Arena — home"
      >
        🍷 <span className="hidden sm:inline">Sommelier Arena</span>
      </a>

      {/* Nav links */}
      <div className="flex items-center gap-2 ml-1">
        <a
          href="/host"
          className="text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
        >
          Host a Game
        </a>
        <a
          href="/play"
          className="text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
        >
          Let's Play
        </a>
        <a
          href={DOCS_URL}
          className="text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
        >
          Read the Docs
        </a>
        <a
          href="https://github.com/ducatillon/sommelier-arena"
          className="text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
        >
          Git Repository
        </a>
      </div>
    </nav>
  );
}
