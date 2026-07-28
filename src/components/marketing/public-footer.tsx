/** Minimal footer for the public pages — no nav links, matching AppShell's own footer tone. */
export function PublicFooter() {
  return (
    <footer className="border-t border-line/60">
      <div className="mx-auto max-w-content px-4 py-6 text-xs leading-relaxed text-ink-subtle sm:px-6">
        <p>HomeScope is a private, single-household application — nothing you record is shared outside it.</p>
      </div>
    </footer>
  );
}
