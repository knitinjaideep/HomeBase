"use client";

import { useEffect, useState } from "react";
import { useFinancial, useHousehold, useScenarios } from "@/lib/hooks";
import { createScenario, deleteScenario, duplicateScenario, saveScenario } from "@/lib/repo";
import {
  baseScenarioValues,
  PRESETS,
  scenarioToPlanInputs,
  type ScenarioValues,
} from "@/lib/finance-presets";
import { evaluatePlan } from "@/lib/calculations";
import { Button, Field, Input, PageHeader, Panel, Select, Toggle } from "@/components/ui";
import { PlanResultView } from "@/components/finance/plan-result-view";
import { useToast } from "@/components/toast";
import type { MortgageScenario } from "@/lib/models";

export default function FinancesPage() {
  const financial = useFinancial();
  const household = useHousehold();
  const scenarios = useScenarios();
  const { notify } = useToast();

  const [draft, setDraft] = useState<ScenarioValues | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (draft || !financial || !household) return;
    setDraft(baseScenarioValues(financial, household, "Comfortable"));
  }, [draft, financial, household]);

  if (!financial || !household || !scenarios || !draft) {
    return <div className="text-ink-subtle">Loading…</div>;
  }

  const setField = <K extends keyof ScenarioValues>(k: K, v: ScenarioValues[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const plan = evaluatePlan(scenarioToPlanInputs(draft, financial));

  const loadSaved = (s: MortgageScenario) => {
    const { id, createdAt, updatedAt, ...values } = s;
    void createdAt;
    void updatedAt;
    setDraft(values);
    setSavedId(id);
  };

  const save = async () => {
    if (savedId) {
      const existing = scenarios.find((s) => s.id === savedId);
      if (existing) {
        await saveScenario({ ...existing, ...draft });
        notify("Scenario updated");
        return;
      }
    }
    const created = await createScenario(draft);
    setSavedId(created.id);
    notify("Scenario saved");
  };

  const duplicate = async () => {
    if (savedId) {
      await duplicateScenario(savedId);
      notify("Scenario duplicated");
    } else {
      const created = await createScenario({ ...draft, name: `${draft.name} (copy)` });
      setSavedId(created.id);
      notify("Scenario saved as copy");
    }
  };

  const remove = async () => {
    if (!savedId) return;
    await deleteScenario(savedId);
    setSavedId(null);
    notify("Scenario deleted");
  };

  return (
    <div>
      <PageHeader
        title="Financial planner"
        description="A mortgage and cash calculator. Change any input to see the estimate update."
      />

      {/* Scenario controls */}
      <Panel className="mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Scenario name" className="min-w-[12rem] flex-1">
            <Input value={draft.name} onChange={(e) => setField("name", e.target.value)} />
          </Field>
          <Button onClick={save}>{savedId ? "Update" : "Save"}</Button>
          <Button variant="secondary" onClick={duplicate}>
            Duplicate
          </Button>
          {savedId && (
            <Button variant="danger" onClick={remove}>
              Delete
            </Button>
          )}
        </div>

        <div className="mt-4 border-t border-line pt-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
            Start from a preset
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  setDraft(p.build(financial, household));
                  setSavedId(null);
                }}
                className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:bg-surface-muted"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {scenarios.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
              Saved scenarios
            </div>
            <div className="flex flex-wrap gap-2">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadSaved(s)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    savedId === s.id
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-line text-ink hover:bg-surface-muted"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-5">
          <Group title="Purchase & loan">
            <Num label="Purchase price" value={draft.purchasePrice} onChange={(v) => setField("purchasePrice", v)} prefix="$" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Down payment mode">
                <Select
                  value={draft.downPaymentMode}
                  onChange={(e) => setField("downPaymentMode", e.target.value as "dollars" | "percent")}
                >
                  <option value="percent">Percent</option>
                  <option value="dollars">Dollars</option>
                </Select>
              </Field>
              <Num
                label={draft.downPaymentMode === "percent" ? "Down payment (%)" : "Down payment ($)"}
                value={draft.downPaymentValue}
                onChange={(v) => setField("downPaymentValue", v)}
                suffix={draft.downPaymentMode === "percent" ? "%" : undefined}
                prefix={draft.downPaymentMode === "dollars" ? "$" : undefined}
              />
            </div>
            <Num label="Mortgage rate (%)" value={draft.mortgageRatePct} onChange={(v) => setField("mortgageRatePct", v)} suffix="%" step="0.01" />
            <Num label="Loan term (years)" value={draft.loanTermYears} onChange={(v) => setField("loanTermYears", v)} />
          </Group>

          <Group title="Taxes, insurance, HOA & PMI">
            <Num label="Annual property taxes" value={draft.annualPropertyTaxes} onChange={(v) => setField("annualPropertyTaxes", v)} prefix="$" />
            <Num label="Annual homeowners insurance" value={draft.annualInsurance} onChange={(v) => setField("annualInsurance", v)} prefix="$" />
            <Num label="Monthly HOA" value={draft.monthlyHoa} onChange={(v) => setField("monthlyHoa", v)} prefix="$" />
            <div className="flex items-center justify-between gap-3 pt-1">
              <Toggle checked={draft.includePmi} onChange={(v) => setField("includePmi", v)} label="Include mortgage insurance (under 20% down)" />
            </div>
          </Group>

          <Group title="Cash to close">
            <Num label="Closing costs" value={draft.closingCosts} onChange={(v) => setField("closingCosts", v)} prefix="$" />
            <Num label="Prepaid & escrow estimate" value={draft.prepaidEscrow} onChange={(v) => setField("prepaidEscrow", v)} prefix="$" />
            <Num label="Immediate renovation budget" value={draft.immediateRenovation} onChange={(v) => setField("immediateRenovation", v)} prefix="$" />
            <Num label="Moving budget" value={draft.movingBudget} onChange={(v) => setField("movingBudget", v)} prefix="$" />
          </Group>

          <Group title="Ongoing costs">
            <Num label="Maintenance (% of value / yr)" value={draft.maintenancePct} onChange={(v) => setField("maintenancePct", v)} suffix="%" step="0.1" />
            <Num label="Utilities estimate (monthly)" value={draft.utilitiesMonthly} onChange={(v) => setField("utilitiesMonthly", v)} prefix="$" />
            <Num label="Commuting difference (monthly)" value={draft.commutingDeltaMonthly} onChange={(v) => setField("commutingDeltaMonthly", v)} prefix="$" />
            <Num label="Renovation savings allocation (monthly)" value={draft.renovationAllocationMonthly} onChange={(v) => setField("renovationAllocationMonthly", v)} prefix="$" />
          </Group>

          <Group title="Funds & reserves">
            <Num label="Available purchase funds" value={draft.availableFunds} onChange={(v) => setField("availableFunds", v)} prefix="$" hint="Retirement funds are excluded by default." />
            <Num label="Minimum reserve" value={draft.minReserve} onChange={(v) => setField("minReserve", v)} prefix="$" />
            <Num label="Preferred reserve" value={draft.preferredReserve} onChange={(v) => setField("preferredReserve", v)} prefix="$" />
          </Group>

          <Group title="Income & debts">
            <Num label="Gross household income (monthly)" value={draft.grossMonthlyIncome} onChange={(v) => setField("grossMonthlyIncome", v)} prefix="$" />
            <Num label="Take-home income (monthly)" value={draft.takeHomeMonthlyIncome} onChange={(v) => setField("takeHomeMonthlyIncome", v)} prefix="$" />
            <Num label="Monthly debt payments" value={draft.monthlyDebts} onChange={(v) => setField("monthlyDebts", v)} prefix="$" />
            <Num label="Childcare assumption (monthly)" value={draft.childcareMonthly} onChange={(v) => setField("childcareMonthly", v)} prefix="$" hint="Editable planning assumption." />
            <Field label="Assumption note" hint="e.g. assumes attending salary from July 2027">
              <Input value={draft.assumptionNote} onChange={(e) => setField("assumptionNote", e.target.value)} />
            </Field>
          </Group>
        </div>

        {/* Outputs */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <PlanResultView plan={plan} />
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel className="p-5">
      <h3 className="mb-3 font-display text-base text-ink">{title}</h3>
      <div className="space-y-3">{children}</div>
    </Panel>
  );
}

function Num({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-subtle">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          step={step}
          inputMode="decimal"
          className={`${prefix ? "pl-7" : ""} ${suffix ? "pr-8" : ""}`}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-subtle">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}
