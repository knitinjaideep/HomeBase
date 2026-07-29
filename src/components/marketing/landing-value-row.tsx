const VALUES: { title: string; blurb: string; icon: (props: { className?: string }) => React.ReactNode }[] = [
  {
    title: "Notes-first workspace",
    blurb: "Record what actually happened — not a form you fill in for us.",
    icon: NoteIcon,
  },
  {
    title: "Homes and visits",
    blurb: "Keep every home you look at and every visit connected in one place.",
    icon: HomeIcon,
  },
  {
    title: "Maintenance history",
    blurb: "Repairs, projects, and reminders stay with the home over time.",
    icon: WrenchIcon,
  },
  {
    title: "Documents and warranties",
    blurb: "The paperwork that matters, kept where you’ll actually find it.",
    icon: DocumentIcon,
  },
];

/** A small, restrained section — deliberately not a marketing-site feature grid. */
export function LandingValueRow() {
  return (
    <section id="why-homescope" className="border-t border-line/60">
      <div className="mx-auto max-w-content px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {VALUES.map((item) => (
            <div key={item.title}>
              <item.icon className="h-5 w-5 text-accent" />
              <h2 className="mt-1.5 font-display text-base text-ink">{item.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.blurb}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M7 3h8l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4M9 12h6M9 16h4" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10.5V20h14v-9.5" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M15.5 5.5a3.5 3.5 0 0 0-4.6 3.9L4 16.3V20h3.7l6.9-6.9a3.5 3.5 0 0 0 3.9-4.6L16 11l-3-3 2.5-2.5Z" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M8 3h6l4 4v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4" />
      <path d="m9.5 13 1.5 1.5L14.5 11" />
    </svg>
  );
}
