"use client";

import { useMemo, useState } from "react";
import { useResources } from "@/lib/hooks";
import {
  createResource,
  deleteResource,
  reportResourceOutdated,
  restoreSeededResources,
  updateResource,
} from "@/lib/repo";
import { GUIDE_STAGES } from "@/lib/guide";
import type { Resource, ResourcePublisherKind, ResourceStatus } from "@/lib/models";
import {
  PageHeader,
  Panel,
  Button,
  Field,
  Input,
  Select,
  Textarea,
  Callout,
  Chip,
  EmptyState,
} from "@/components/ui";
import { dateLabel } from "@/lib/format";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/util";

const PUBLISHER_LABELS: Record<ResourcePublisherKind, string> = {
  "federal-government": "Federal government",
  "nj-government": "New Jersey government",
  regulator: "Regulator",
  "consumer-education": "Consumer education",
  "professional-organization": "Professional organisation",
  secondary: "Secondary source",
};

const PUBLISHER_TONE: Record<ResourcePublisherKind, "accent" | "neutral"> = {
  "federal-government": "accent",
  "nj-government": "accent",
  regulator: "accent",
  "consumer-education": "neutral",
  "professional-organization": "neutral",
  secondary: "neutral",
};

export default function ResourcesPage() {
  const resources = useResources();
  const { notify } = useToast();
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    return (resources ?? [])
      .filter((r) => (showArchived ? true : r.status !== "archived"))
      .filter((r) => stageFilter === "all" || r.stageIds.includes(stageFilter))
      .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || a.title.localeCompare(b.title));
  }, [resources, stageFilter, showArchived]);

  if (!resources) return <div className="text-ink-subtle">Loading…</div>;

  const restore = async () => {
    const n = await restoreSeededResources();
    notify(n > 0 ? `Restored ${n} curated resource${n === 1 ? "" : "s"}.` : "All curated resources are already present.");
  };

  return (
    <div>
      <PageHeader
        title="Resource library"
        description="A short shelf of trustworthy sources — government and regulator sources first."
        actions={
          <>
            <Button variant="secondary" onClick={restore}>
              Restore curated set
            </Button>
            <Button onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Close" : "Add resource"}</Button>
          </>
        }
      />

      {showAdd && <AddResourceForm onDone={() => setShowAdd(false)} />}

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Journey stage" className="w-56">
          <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="all">All stages</option>
            {GUIDE_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.number}. {s.shortTitle}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink-muted">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No resources here" description="Adjust the filter, or add a resource." />
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <Callout tone="neutral">
          Professional-organisation resources are educational, not neutral legal advice. Prefer primary
          sources — federal and New Jersey government, then regulators — when one exists.
        </Callout>
      </div>
    </div>
  );
}

function ResourceCard({ resource: r }: { resource: Resource }) {
  const [open, setOpen] = useState(false);
  const { notify } = useToast();
  const set = (patch: Partial<Resource>) => void updateResource(r.id, patch);

  const outdated = r.status === "outdated" || r.status === "needs-review";

  return (
    <Panel className={cn("p-4", outdated && "border-caution/40")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink hover:text-accent"
            >
              {r.title}
            </a>
            <Chip tone={PUBLISHER_TONE[r.publisherKind]}>{PUBLISHER_LABELS[r.publisherKind]}</Chip>
            {r.status === "outdated" && <Chip tone="sample">Reported outdated</Chip>}
            {r.isSeeded && <span className="text-[11px] text-ink-subtle">curated</span>}
          </div>
          <div className="text-sm text-ink-subtle">{r.organization}</div>
          {r.description && <p className="mt-1 text-sm text-ink-muted">{r.description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label={r.isFavorite ? "Unfavorite" : "Favorite"}
            onClick={() => set({ isFavorite: !r.isFavorite })}
            className={cn("text-lg", r.isFavorite ? "text-caution" : "text-ink-subtle hover:text-ink")}
          >
            {r.isFavorite ? "★" : "☆"}
          </button>
          <button onClick={() => setOpen((o) => !o)} className="text-xs text-ink-subtle hover:text-ink">
            {open ? "Less" : "Edit"}
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {r.stageIds.map((sid) => {
          const stage = GUIDE_STAGES.find((s) => s.id === sid);
          return stage ? (
            <span key={sid} className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-ink-subtle">
              {stage.shortTitle}
            </span>
          ) : null;
        })}
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <Input defaultValue={r.title} onBlur={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Organisation">
              <Input defaultValue={r.organization} onBlur={(e) => set({ organization: e.target.value })} />
            </Field>
            <Field label="URL">
              <Input defaultValue={r.url} onBlur={(e) => set({ url: e.target.value })} />
            </Field>
            <Field label="Topic">
              <Input defaultValue={r.topic} onBlur={(e) => set({ topic: e.target.value })} />
            </Field>
            <Field label="Publisher kind">
              <Select
                value={r.publisherKind}
                onChange={(e) => set({ publisherKind: e.target.value as ResourcePublisherKind })}
              >
                {(Object.keys(PUBLISHER_LABELS) as ResourcePublisherKind[]).map((k) => (
                  <option key={k} value={k}>
                    {PUBLISHER_LABELS[k]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={r.status} onChange={(e) => set({ status: e.target.value as ResourceStatus })}>
                {(["active", "needs-review", "outdated", "archived"] as ResourceStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Our summary">
            <Textarea rows={2} defaultValue={r.description} onBlur={(e) => set({ description: e.target.value })} />
          </Field>
          <Field label="Why it's trustworthy / useful">
            <Textarea rows={2} defaultValue={r.whyUseful} onBlur={(e) => set({ whyUseful: e.target.value })} />
          </Field>
          <Field label="Personal notes">
            <Textarea rows={2} defaultValue={r.notes} onBlur={(e) => set({ notes: e.target.value })} />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-ink-subtle">
              Added {dateLabel(r.dateAdded)}
              {r.lastReviewedDate ? ` · last reviewed ${dateLabel(r.lastReviewedDate)}` : ""}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void set({ lastReviewedDate: new Date().toISOString().slice(0, 10), status: "active" });
                  notify("Marked as reviewed today.");
                }}
              >
                Mark reviewed
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const note = prompt("What's wrong with this link? (optional)") ?? "";
                  void reportResourceOutdated(r.id, note);
                  notify("Reported as outdated.");
                }}
              >
                Report outdated
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete "${r.title}"?`)) void deleteResource(r.id);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

function AddResourceForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [organization, setOrganization] = useState("");
  const [stageId, setStageId] = useState<string>("");

  const submit = async () => {
    if (!title.trim()) return;
    await createResource({
      title: title.trim(),
      url: url.trim(),
      organization: organization.trim(),
      stageIds: stageId ? [stageId] : [],
      publisherKind: "secondary",
      status: "active",
    });
    onDone();
  };

  return (
    <Panel className="mb-6 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </Field>
        <Field label="URL">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </Field>
        <Field label="Organisation">
          <Input value={organization} onChange={(e) => setOrganization(e.target.value)} />
        </Field>
        <Field label="Stage">
          <Select value={stageId} onChange={(e) => setStageId(e.target.value)}>
            <option value="">None</option>
            {GUIDE_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.number}. {s.shortTitle}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={submit}>Add resource</Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </Panel>
  );
}
