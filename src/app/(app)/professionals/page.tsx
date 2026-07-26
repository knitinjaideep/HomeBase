"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProfessionals } from "@/lib/hooks";
import { createProfessional } from "@/lib/repo";
import type { Professional, ProfessionalRole, ReferralSource } from "@/lib/models";
import { PageHeader, Panel, Button, Field, Input, Select, Callout, EmptyState, RatingDots } from "@/components/ui";
import { ProfessionalDetail, SelectionControls } from "@/components/professional/professional-detail";
import { PROFESSIONAL_ROLE_LABELS } from "@/lib/labels";
import { money } from "@/lib/format";
import { cn } from "@/lib/util";

const ROLE_ORDER: ProfessionalRole[] = [
  "buyer-agent",
  "attorney",
  "lender",
  "home-inspector",
  "sewer-inspector",
  "oil-tank-sweep",
  "radon-inspector",
  "structural-engineer",
  "insurance-agent",
  "contractor",
  "surveyor",
  "title-company",
  "other",
];

const REFERRAL_OPTIONS: { value: ReferralSource; label: string }[] = [
  { value: "personal-referral", label: "Personal referral" },
  { value: "professional-referral", label: "Professional referral" },
  { value: "open-house", label: "Open house" },
  { value: "brokerage-directory", label: "Brokerage directory" },
  { value: "realtor-directory", label: "REALTOR® directory" },
  { value: "sold-listing-research", label: "Sold-listing research" },
  { value: "online-search", label: "Online search" },
  { value: "other", label: "Other" },
];

export default function ProfessionalsPage() {
  const professionals = useProfessionals();
  const searchParams = useSearchParams();
  const roleFromUrl = searchParams.get("role") as ProfessionalRole | null;

  const [filter, setFilter] = useState<ProfessionalRole | "all">(roleFromUrl ?? "all");
  const [showAdd, setShowAdd] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<ProfessionalRole, Professional[]>();
    (professionals ?? []).forEach((p) => {
      const arr = map.get(p.role) ?? [];
      arr.push(p);
      map.set(p.role, arr);
    });
    return map;
  }, [professionals]);

  if (!professionals) return <div className="text-ink-subtle">Loading…</div>;

  const rolesToShow = filter === "all" ? ROLE_ORDER : [filter];

  return (
    <div>
      <PageHeader
        title="Professional team"
        description="Everyone helping us buy — agent, attorney, lender, inspectors, and more."
        actions={<Button onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Close" : "Add professional"}</Button>}
      />

      {showAdd && <AddProfessionalForm onDone={() => setShowAdd(false)} defaultRole={filter === "all" ? "buyer-agent" : filter} />}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            filter === "all" ? "border-accent bg-accent-soft text-accent" : "border-line text-ink-muted hover:text-ink",
          )}
        >
          All roles
        </button>
        {ROLE_ORDER.filter((r) => (grouped.get(r)?.length ?? 0) > 0).map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              filter === r ? "border-accent bg-accent-soft text-accent" : "border-line text-ink-muted hover:text-ink",
            )}
          >
            {PROFESSIONAL_ROLE_LABELS[r]}
            <span className="ml-1.5 text-xs text-ink-subtle">{grouped.get(r)?.length}</span>
          </button>
        ))}
      </div>

      {professionals.length === 0 ? (
        <EmptyState
          title="No professionals yet"
          description="Start with a buyer's agent: gather candidates from several sources, interview at least three, and verify their New Jersey licence and recent local experience."
          action={<Button onClick={() => setShowAdd(true)}>Add the first candidate</Button>}
        />
      ) : (
        <div className="space-y-8">
          {rolesToShow.map((role) => {
            const list = grouped.get(role) ?? [];
            if (list.length === 0) return null;
            return (
              <section key={role}>
                <h2 className="mb-3 font-display text-xl text-ink">{PROFESSIONAL_ROLE_LABELS[role]}</h2>
                {role === "buyer-agent" && <AgentGuidance />}
                <div className="space-y-3">
                  {list
                    .sort((a, b) => selectionRank(a) - selectionRank(b) || a.name.localeCompare(b.name))
                    .map((p) => (
                      <ProfessionalCard key={p.id} professional={p} />
                    ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function selectionRank(p: Professional): number {
  const order: Record<string, number> = { selected: 0, interviewed: 1, candidate: 2, "not-selected": 3, "no-longer-considering": 4 };
  return order[p.selectionStatus] ?? 5;
}

function ProfessionalCard({ professional }: { professional: Professional }) {
  const [open, setOpen] = useState(false);
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{professional.name}</span>
            {professional.rating !== null && <RatingDots value={professional.rating} />}
          </div>
          <div className="text-sm text-ink-subtle">
            {professional.company || "—"}
            {professional.feeEstimate ? ` · ${money(professional.feeEstimate)} est.` : ""}
            {professional.interviewDate ? " · interviewed" : ""}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <SelectionControls professional={professional} />
          <button onClick={() => setOpen((o) => !o)} className="text-xs text-ink-subtle hover:text-ink">
            {open ? "Close" : "Open"}
          </button>
        </div>
      </div>
      {open && <ProfessionalDetail professional={professional} />}
    </Panel>
  );
}

function AgentGuidance() {
  return (
    <Callout tone="neutral" className="mb-3">
      The listing agent represents the seller unless a different agency arrangement is explicitly
      established. Read any buyer representation agreement carefully before signing, and discuss compensation
      and scope explicitly. Interview several candidates rather than hiring the first referral.
    </Callout>
  );
}

function AddProfessionalForm({
  onDone,
  defaultRole,
}: {
  onDone: () => void;
  defaultRole: ProfessionalRole;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<ProfessionalRole>(defaultRole);
  const [company, setCompany] = useState("");
  const [referral, setReferral] = useState<ReferralSource>("personal-referral");

  const submit = async () => {
    if (!name.trim()) return;
    await createProfessional({
      name: name.trim(),
      role,
      company: company.trim(),
      referralSource: referral,
      selectionStatus: "candidate",
    });
    onDone();
  };

  return (
    <Panel className="mb-6 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoFocus />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as ProfessionalRole)}>
            {ROLE_ORDER.map((r) => (
              <option key={r} value={r}>
                {PROFESSIONAL_ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Company">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} />
        </Field>
        <Field label="How we found them">
          <Select value={referral} onChange={(e) => setReferral(e.target.value as ReferralSource)}>
            {REFERRAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={submit}>Add candidate</Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </Panel>
  );
}
