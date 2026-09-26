import type { StageId } from "@/lib/guide";

/**
 * Small line icons for the Journey's activities (the repo uses inline SVG
 * icons rather than an icon library). Decorative — always paired with the
 * activity's text label, so they are hidden from assistive technology.
 */
const PATHS: Record<StageId, React.ReactNode> = {
  strategy: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  finances: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
    </>
  ),
  attending: (
    <>
      <path d="m4 18 5-6 4 3 7-8" />
      <path d="M15 7h5v5" />
    </>
  ),
  "town-research": (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  "home-preferences": (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M10 20v-5h4v5" />
    </>
  ),
  "school-priorities": (
    <>
      <path d="m2 9 10-5 10 5-10 5L2 9Z" />
      <path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" />
    </>
  ),
  commute: (
    <>
      <path d="M5 16v-4l2-5h10l2 5v4z" />
      <path d="M5 12h14" />
      <circle cx="8" cy="17" r="1.5" />
      <circle cx="16" cy="17" r="1.5" />
    </>
  ),
  "mortgage-options": (
    <>
      <path d="M19 5 5 19" />
      <circle cx="7" cy="7" r="2" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),
  "lender-interviews": <path d="M4 5h16v11H9l-5 4V5Z" />,
  preapproval: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  "agent-selection": (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  "professional-team": (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 19c0-3.3 2.7-5 6-5s6 1.7 6 5M15.5 14.2c2.8 0 5.5 1.2 5.5 4" />
    </>
  ),
  "active-search": (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4-4" />
    </>
  ),
  touring: (
    <>
      <path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M4 21h16" />
      <circle cx="14.5" cy="12" r=".8" fill="currentColor" />
    </>
  ),
  "offer-prep": (
    <>
      <path d="M6 3h8l4 4v14H6V3Z" />
      <path d="M14 3v4h4M9 13h6M9 17h4" />
    </>
  ),
  negotiation: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
  "attorney-review": (
    <>
      <path d="M12 4v16M7 20h10M4 7h16" />
      <path d="m6 7-3 6h6L6 7ZM18 7l-3 6h6l-3-6Z" />
    </>
  ),
  inspections: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4h6v2H9zM9.5 13l2 2 3.5-4" />
    </>
  ),
  financing: (
    <>
      <path d="m3 10 9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />
    </>
  ),
  "closing-prep": (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </>
  ),
  closing: (
    <>
      <circle cx="8" cy="15" r="3" />
      <path d="m10.5 12.5 8-8M15 8l2 2M17.5 5.5l2 2" />
    </>
  ),
};

export function ActivityIcon({ id, className }: { id: StageId; className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[id]}
    </svg>
  );
}
