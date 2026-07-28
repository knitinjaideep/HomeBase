const PRINCIPLES = [
  { title: "Notes first", blurb: "Record what actually happened — not a form you fill in for us." },
  { title: "Your information stays organized", blurb: "One private place instead of scattered notes apps and email threads." },
  { title: "Built for buying and ownership", blurb: "The same home record carries you from the search into caring for it." },
  { title: "Your home record grows over time", blurb: "Nothing is discarded when your stage changes — it keeps building." },
];

/** A small, restrained section — deliberately not a marketing-site feature grid. */
export function ProductPrinciples() {
  return (
    <section className="border-t border-line/60">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {PRINCIPLES.map((p) => (
            <div key={p.title}>
              <h2 className="font-display text-base text-ink">{p.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{p.blurb}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
