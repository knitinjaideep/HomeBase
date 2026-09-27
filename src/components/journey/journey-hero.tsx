import Link from "next/link";

/**
 * The Journey page header: an optional breadcrumb or eyebrow, the page's one
 * h1, and a short line beneath it. A soft illustration sits behind the right
 * edge on wide screens only — decorative, so hidden from assistive technology,
 * hidden in print, and faded so it never sits behind the text.
 */
export function JourneyHero({
  eyebrow,
  breadcrumb,
  title,
  children,
}: {
  eyebrow?: string;
  breadcrumb?: { label: string; href?: string }[];
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative mb-6 overflow-hidden rounded-2xl lg:min-h-[9.5rem]">
      <div aria-hidden className="hs-journey-art no-print absolute inset-y-0 right-0 hidden w-1/2 opacity-90 lg:block" />
      <div className="relative max-w-2xl py-2 lg:max-w-lg">
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="mb-2 text-sm text-ink-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              {breadcrumb.map((crumb, i) => (
                <li key={crumb.label} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden>/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-accent">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-ink">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{eyebrow}</div>}
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        {children && <p className="mt-2 text-base text-ink-muted sm:text-lg">{children}</p>}
      </div>
    </header>
  );
}
