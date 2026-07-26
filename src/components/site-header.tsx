import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[color-mix(in_oklab,var(--background)_80%,transparent)] border-b border-border">
      <div className="mx-auto max-w-5xl px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl group-hover:rotate-12 transition-transform">💅</span>
          <span className="font-display font-black text-xl tracking-tight text-gradient-hot">
            Chismes
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/" className="btn-ghost-hot text-sm hidden sm:inline-flex">Foros</Link>
          <Link to="/nuevo" className="btn-hot text-sm">
            <span>✍️</span> Soltar chisme
          </Link>
        </nav>
      </div>
    </header>
  );
}
