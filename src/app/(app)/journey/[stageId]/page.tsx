"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStage, GUIDE_STAGES } from "@/lib/guide";
import { useJourneySnapshot } from "@/lib/journey/use-snapshot";
import { stageProgress } from "@/lib/journey/progress";
import { personalizedLines } from "@/lib/journey/personalization";
import { evaluateCheck } from "@/lib/journey/criteria";
import { setStageState } from "@/lib/repo";
import { Button, Callout, Select } from "@/components/ui";
import { StatusPill, ProgressBar, BulletList } from "@/components/journey/journey-ui";
import { ActionRow } from "@/components/journey/action-row";
import { DecisionRow } from "@/components/journey/decision-row";
import { QuestionSetView } from "@/components/journey/question-set";
import { AttendingTracker } from "@/components/journey/attending-tracker";
import { TownResearchTool } from "@/components/journey/town-research-tool";
import { Overlay } from "@/components/modal";
import { NoteContextPanel } from "@/components/notes/note-context-panel";
import { JOURNEY_STATUS_LABELS } from "@/lib/labels";
import type { JourneyStatus } from "@/lib/models";
import type { JourneySnapshot } from "@/lib/journey/snapshot";
import type { GuideStage } from "@/lib/guide";

export default function StagePage({ params }: { params: Promise<{ stageId: string }> }) {
  const { stageId } = use(params);
  const stage = getStage(stageId);
  const snapshot = useJourneySnapshot();

  if (!stage) notFound();
  if (!snapshot) return <div className="text-ink-subtle">Loading…</div>;

  return <StageView stage={stage} s={snapshot} />;
}

function StageView({ stage, s }: { stage: GuideStage; s: JourneySnapshot }) {
  const [guideOpen, setGuideOpen] = useState(false);
  const progress = useMemo(() => stageProgress(stage, s), [stage, s]);
  const personalLines = useMemo(() => personalizedLines(stage, s), [stage, s]);
  const actionStateById = useMemo(() => new Map(s.actions.map((a) => [a.id, a])), [s.actions]);
  const decisionById = useMemo(() => new Map(s.decisions.map((d) => [d.id, d])), [s.decisions]);
  const stageState = s.stageStates.find((x) => x.id === stage.id);

  const index = GUIDE_STAGES.findIndex((x) => x.id === stage.id);
  const prev = index > 0 ? GUIDE_STAGES[index - 1] : undefined;
  const next = index < GUIDE_STAGES.length - 1 ? GUIDE_STAGES[index + 1] : undefined;

  const stageResources = s.resources.filter(
    (r) => r.stageIds.includes(stage.id) && r.status !== "archived",
  );
  const topWarning = stage.warnings?.[0];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href="/journey" className="text-ink-muted hover:text-accent">
          ← Journey
        </Link>
        <span className="text-ink-subtle">
          Stage {stage.number} of {GUIDE_STAGES.length}
        </span>
      </div>

      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{stage.title}</h1>
          <StatusPill status={progress.status} />
        </div>
        <p className="mt-2 text-sm text-ink-muted">{stage.purpose}</p>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-ink-subtle">
            <span>
              {progress.actionsDone} of {progress.actionsTotal} tasks complete
            </span>
            <StageStatusOverride stageId={stage.id} value={stageState?.statusOverride ?? null} />
          </div>
          <ProgressBar
            fraction={progress.fraction}
            tone={progress.status === "completed" ? "positive" : "accent"}
          />
        </div>
      </div>

      {/* The single most important warning, if any */}
      {topWarning && (
        <div className="mb-6">
          <Callout tone={topWarning.tone === "critical" ? "critical" : "caution"}>
            <span className="font-medium">{topWarning.tone === "critical" ? "Important: " : "Note: "}</span>
            {topWarning.text}
          </Callout>
        </div>
      )}

      {/* Embedded stage-specific tools — these are how the tasks below get done */}
      {stage.id === "attending" && (
        <div className="mb-6">
          <AttendingTracker transition={s.attending} household={s.household} />
        </div>
      )}
      {stage.id === "town-research" && (
        <div className="mb-6">
          <TownResearchTool towns={s.towns} />
        </div>
      )}

      {/* Tasks */}
      <section>
        <h2 className="font-display text-lg text-ink">Tasks</h2>
        <div className="mt-3 space-y-2">
          {stage.actions.map((action) => (
            <ActionRow
              key={action.id}
              action={action}
              stageId={stage.id}
              state={actionStateById.get(action.id)}
            />
          ))}
        </div>
      </section>

      {/* Decisions to make */}
      {stage.decisions.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-ink">Decisions to make</h2>
          <div className="mt-3 space-y-2">
            {stage.decisions.map((decision) => (
              <DecisionRow
                key={decision.id}
                decision={decision}
                stageId={stage.id}
                record={decisionById.get(decision.id)}
                buyer1Name={s.household.buyer1Name}
                buyer2Name={s.household.buyer2Name}
              />
            ))}
          </div>
        </section>
      )}

      {/* Everything educational lives behind one door */}
      <div className="mt-8">
        <Button variant="secondary" onClick={() => setGuideOpen(true)}>
          View guide
        </Button>
      </div>

      {/* Prev / next */}
      <div className="mt-8">
        <NoteContextPanel contextType="journeyStage" contextId={stage.id} title="Notes about this stage" />
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
        {prev ? (
          <Link href={`/journey/${prev.id}`} className="text-sm text-ink-muted hover:text-accent">
            ← {prev.number}. {prev.shortTitle}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/journey/${next.id}`} className="text-sm font-medium text-accent hover:underline">
            {next.number}. {next.shortTitle} →
          </Link>
        ) : (
          <Link href="/journey" className="text-sm font-medium text-accent hover:underline">
            Back to Journey →
          </Link>
        )}
      </div>

      <Overlay open={guideOpen} onClose={() => setGuideOpen(false)} title={`Guide: ${stage.shortTitle}`} variant="drawer">
        <div className="space-y-8 p-5 sm:p-6">
          {/* Why it matters */}
          <GuideSection title="Why it matters">
            <p className="text-sm text-ink-muted">{stage.explanation}</p>
            {personalLines.length > 0 && (
              <div className="mt-3 rounded-xl border border-accent/20 bg-accent-soft/40 p-4">
                <BulletList items={personalLines} />
              </div>
            )}
          </GuideSection>

          {/* Questions to ask */}
          {stage.questionSets.length > 0 && (
            <GuideSection title="Questions to ask">
              <div className="space-y-3">
                {stage.questionSets.map((set, i) => (
                  <QuestionSetView key={i} set={set} />
                ))}
              </div>
            </GuideSection>
          )}

          {/* Documents or evidence */}
          {stage.documents.length > 0 && (
            <GuideSection title="Documents or evidence">
              <ul className="space-y-2">
                {stage.documents.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                    <div>
                      <span className="text-ink">{doc.label}</span>
                      {doc.note && <span className="text-ink-subtle"> — {doc.note}</span>}
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/timeline?tab=documents" className="mt-3 inline-block text-sm text-accent hover:underline">
                Track these in the document index →
              </Link>
            </GuideSection>
          )}

          {/* Mistakes to avoid */}
          {stage.mistakes.length > 0 && (
            <GuideSection title="Mistakes to avoid">
              <div className="rounded-xl border border-caution/30 bg-caution/[0.06] p-4">
                <BulletList items={stage.mistakes} tone="caution" />
              </div>
            </GuideSection>
          )}

          {/* Useful resources */}
          {stageResources.length > 0 && (
            <GuideSection title="Useful resources">
              <div className="space-y-2">
                {stageResources.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-line bg-surface p-3 hover:border-accent/50"
                  >
                    <div className="text-sm font-medium text-ink">{r.title}</div>
                    <div className="text-xs text-ink-subtle">{r.organization}</div>
                  </a>
                ))}
              </div>
            </GuideSection>
          )}

          {/* What "done" looks like */}
          <GuideSection title="What &ldquo;done&rdquo; looks like">
            <ul className="space-y-2.5">
              {stage.completionCriteria.map((c) => {
                const met = c.autoCheck ? evaluateCheck(c.autoCheck, s) : false;
                return (
                  <li key={c.id} className="flex items-start gap-2.5 text-sm">
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                        met ? "bg-positive text-white" : "border border-line text-transparent"
                      }`}
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span className={met ? "text-ink" : "text-ink-muted"}>{c.label}</span>
                  </li>
                );
              })}
            </ul>
          </GuideSection>

          {/* Related tools */}
          <GuideSection title="Related tools">
            <div className="grid gap-2 sm:grid-cols-2">
              {stage.relatedTools.map((tool, i) => (
                <Link
                  key={i}
                  href={tool.href}
                  className="rounded-lg border border-line bg-surface p-3 hover:border-accent/50"
                >
                  <div className="text-sm font-medium text-accent">{tool.label}</div>
                  {tool.description && <div className="text-xs text-ink-subtle">{tool.description}</div>}
                </Link>
              ))}
            </div>
          </GuideSection>
        </div>
      </Overlay>
    </div>
  );
}

function GuideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-display text-base text-ink">{title}</h3>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

/** Manual status override — lets the household force a status, e.g. Not applicable. */
function StageStatusOverride({
  stageId,
  value,
}: {
  stageId: string;
  value: JourneyStatus | null;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-ink-subtle">Mark stage:</span>
      <Select
        className="h-7 min-h-0 w-auto py-0 text-xs"
        value={value ?? "auto"}
        onChange={(e) => {
          const v = e.target.value;
          void setStageState(stageId, { statusOverride: v === "auto" ? null : (v as JourneyStatus) });
        }}
      >
        <option value="auto">Automatic</option>
        {(Object.keys(JOURNEY_STATUS_LABELS) as JourneyStatus[]).map((st) => (
          <option key={st} value={st}>
            {JOURNEY_STATUS_LABELS[st]}
          </option>
        ))}
      </Select>
    </label>
  );
}
