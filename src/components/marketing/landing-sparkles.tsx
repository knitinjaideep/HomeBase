/** Fixed positions/delays (not random per render) so server and client markup match exactly. */
const SPARKLES: { top: string; left: string; size: number; delay: number; duration: number }[] = [
  { top: "14%", left: "9%", size: 3, delay: 0, duration: 4.2 },
  { top: "24%", left: "20%", size: 2, delay: 1.4, duration: 3.6 },
  { top: "10%", left: "34%", size: 2, delay: 2.6, duration: 4.6 },
  { top: "40%", left: "6%", size: 2, delay: 0.8, duration: 3.8 },
  { top: "60%", left: "13%", size: 3, delay: 2, duration: 4.4 },
  { top: "18%", left: "78%", size: 2, delay: 0.4, duration: 4 },
  { top: "9%", left: "90%", size: 3, delay: 1.8, duration: 3.6 },
  { top: "32%", left: "94%", size: 2, delay: 3, duration: 4.8 },
  { top: "52%", left: "86%", size: 2, delay: 1, duration: 4.2 },
  { top: "70%", left: "92%", size: 3, delay: 2.4, duration: 3.9 },
  { top: "82%", left: "16%", size: 2, delay: 0.6, duration: 4.5 },
  { top: "78%", left: "60%", size: 2, delay: 1.6, duration: 4 },
];

/** Decorative twinkle layer over the hero artwork — see globals.css for the animation. */
export function LandingSparkles() {
  return (
    <div className="landing-page__sparkles" aria-hidden="true">
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="hs-sparkle"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
