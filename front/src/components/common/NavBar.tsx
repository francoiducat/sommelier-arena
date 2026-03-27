import React from 'react';

const DOCS_URL: string = (import.meta as any).env?.PUBLIC_DOCS_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? `http://localhost:3002/docs`
    : 'https://sommelier-arena.ducatillon.net/docs');

export function NavBar() {
  return (
    <nav
      className="w-full bg-white shadow-md px-6 py-0 flex items-center sticky top-0 z-10"
      style={{ height: '3.75rem' }}
      aria-label="Main navigation"
    >
      {/* Brand — mirrors Docusaurus navbar brand */}
      <a
        href="/"
        className="flex items-center gap-2 font-bold text-base text-slate-800 hover:text-wine-600 transition-colors shrink-0 mr-6"
        aria-label="Sommelier Arena — home"
      >
        🍷 <span className="hidden sm:inline">Sommelier Arena</span>
      </a>

      {/* Nav links — mirrors Docusaurus navbar items */}
      <div className="flex items-center gap-1">
        <a
          href="/host"
          className="text-base text-slate-600 hover:text-wine-600 transition-colors px-3 py-2"
        >
          Host a Game
        </a>
        <a
          href="/play"
          className="text-base text-slate-600 hover:text-wine-600 transition-colors px-3 py-2"
        >
          Let's Play
        </a>
        <a
          href={DOCS_URL}
          className="text-base text-slate-600 hover:text-wine-600 transition-colors px-3 py-2"
        >
          Read the Docs
        </a>
        <a
          href="https://github.com/francoiducat/sommelier-arena"
          className="text-base text-slate-600 hover:text-wine-600 transition-colors px-3 py-2"
        >
          Git Repository
        </a>
      </div>
    </nav>
  );
}
