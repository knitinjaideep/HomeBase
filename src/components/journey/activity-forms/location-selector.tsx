"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/util";
import { Button, Input, Select } from "@/components/ui";
import { searchGeographiesApi, type GeographySearchFn } from "@/lib/geography/client";
import { MIN_QUERY_LENGTH, type GeographyResult } from "@/lib/geography/search";
import { US_STATES } from "@/lib/geography/states";
import { choiceFromGeography, customChoice, formatTown, isUnlinked, sameTown, type TownChoice } from "@/lib/journey/towns";

const DEBOUNCE_MS = 250;

/** Where the highlighted result moves on an arrow key; -1 = none. Wraps at both ends. */
export function nextActiveIndex(current: number, key: "ArrowDown" | "ArrowUp", count: number): number {
  if (count === 0) return -1;
  if (key === "ArrowDown") return current + 1 >= count ? 0 : current + 1;
  return current <= 0 ? count - 1 : current - 1;
}

/**
 * Reusable location picker. Search-as-you-type against HomeScope's own
 * geography search (Census-backed, stored in Supabase); the selection is a list
 * of removable cards that store the canonical geography id, not just a label.
 * "Add custom location" covers anything with no Census match — those are
 * labelled custom and never receive a GEOID. Controlled: value in, onChange out,
 * nothing saved here.
 *
 * Keyboard: type to search (after 2 characters), ↑/↓ to move through results,
 * Enter to pick, Esc to close.
 */
export function LocationSelector({
  label,
  value,
  onChange,
  taken = [],
  takenLabel = "Already chosen",
  reorderable = false,
  state,
  search = searchGeographiesApi,
}: {
  /** Names this selector for assistive tech, e.g. "primary locations". */
  label: string;
  value: TownChoice[];
  onChange: (next: TownChoice[]) => void;
  /** Locations chosen in another list; they show in results but cannot be added here. */
  taken?: TownChoice[];
  /** Why they are disabled, e.g. "In backup towns". */
  takenLabel?: string;
  reorderable?: boolean;
  /** Restrict results to one state (two-letter code). */
  state?: string;
  search?: GeographySearchFn;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeographyResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [active, setActive] = useState(-1);
  const [custom, setCustom] = useState(false);
  const listId = useId();
  const searchable = query.trim().length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!searchable) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setStatus("loading");
      search(query.trim(), state, controller.signal)
        .then((r) => {
          setResults(r);
          setActive(-1);
          setStatus("idle");
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          console.error("Location search failed", err);
          setResults([]);
          setStatus("error");
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchable, state, search]);

  const disabledReason = (choice: TownChoice) =>
    value.some((v) => sameTown(v, choice)) ? "Added" : taken.some((t) => sameTown(t, choice)) ? takenLabel : null;

  const add = (choice: TownChoice) => {
    if (disabledReason(choice)) return;
    onChange([...value, choice]);
    setQuery("");
    setResults([]);
    setActive(-1);
  };
  const move = (index: number, by: -1 | 1) => {
    const next = [...value];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    onChange(next);
  };
  const optionId = (i: number) => `${listId}-opt-${i}`;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => nextActiveIndex(a, e.key as "ArrowDown" | "ArrowUp", results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && results[active]) add(choiceFromGeography(results[active]));
    } else if (e.key === "Escape") {
      setQuery("");
      setResults([]);
    }
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul aria-label={`Selected ${label}`} className="grid gap-2 sm:grid-cols-2">
          {value.map((t, i) => (
            <li
              key={`${t.geographyId ?? t.name}-${t.state}-${t.county}`}
              className="flex items-center gap-1 rounded-xl border border-accent/40 bg-accent-soft py-1.5 pl-3 pr-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {reorderable && value.length > 1 && <span className="mr-1.5 text-xs text-ink-subtle">{i + 1}.</span>}
                  {formatTown(t)}
                </p>
                {(t.county || t.isCustom || isUnlinked(t)) && (
                  <p className="truncate text-xs text-ink-subtle">
                    {t.isCustom ? "Custom location" : t.county ? t.county : "Not matched to a Census location"}
                  </p>
                )}
              </div>
              {reorderable && value.length > 1 && (
                <>
                  <IconButton label={`Move ${formatTown(t)} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</IconButton>
                  <IconButton label={`Move ${formatTown(t)} down`} disabled={i === value.length - 1} onClick={() => move(i, 1)}>↓</IconButton>
                </>
              )}
              <IconButton label={`Remove ${formatTown(t)}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>×</IconButton>
            </li>
          ))}
        </ul>
      )}

      <div className="relative max-w-sm">
        <Input
          role="combobox"
          aria-label={`Search for a town or city — ${label}`}
          aria-autocomplete="list"
          aria-expanded={searchable}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          autoComplete="off"
          value={query}
          maxLength={60}
          placeholder="Search for a town or city"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {searchable && (
          <ul
            id={listId}
            role="listbox"
            aria-label="Matching locations"
            className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-surface py-1 shadow-lg"
          >
            {results.map((r, i) => {
              const reason = disabledReason(choiceFromGeography(r));
              return (
                <li key={r.id} id={optionId(i)} role="option" aria-selected={i === active} aria-disabled={reason !== null}>
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={reason !== null}
                    onClick={() => add(choiceFromGeography(r))}
                    className={cn(
                      "flex min-h-[44px] w-full items-center justify-between gap-3 px-3 py-1.5 text-left",
                      i === active && "bg-accent-soft",
                      reason ? "text-ink-subtle" : "text-ink hover:bg-accent-soft",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{r.name}</span>
                      <span className="block truncate text-xs text-ink-subtle">{r.detail}</span>
                    </span>
                    {reason && <span className="shrink-0 text-xs">{reason}</span>}
                  </button>
                </li>
              );
            })}
            {status === "loading" && results.length === 0 && <li role="presentation" className="px-3 py-2 text-sm text-ink-subtle">Searching…</li>}
            {status === "error" && <li role="presentation" className="px-3 py-2 text-sm text-critical">Search isn&apos;t available right now.</li>}
            {status === "idle" && results.length === 0 && <li role="presentation" className="px-3 py-2 text-sm text-ink-subtle">No matching locations.</li>}
            <li role="presentation" className="border-t border-line">
              <button
                type="button"
                onClick={() => setCustom(true)}
                className="flex min-h-[44px] w-full items-center px-3 text-left text-sm text-accent hover:bg-accent-soft"
              >
                Add custom location…
              </button>
            </li>
          </ul>
        )}
      </div>

      {custom ? (
        <CustomLocationForm
          initialName={query}
          onCancel={() => setCustom(false)}
          onAdd={(choice) => {
            add(choice);
            setCustom(false);
          }}
          blocked={(c) => disabledReason(c)}
        />
      ) : (
        !searchable && (
          <button type="button" onClick={() => setCustom(true)} className="text-sm text-ink-muted underline-offset-2 hover:text-accent hover:underline">
            Add custom location
          </button>
        )
      )}
    </div>
  );
}

function CustomLocationForm({
  initialName,
  onAdd,
  onCancel,
  blocked,
}: {
  initialName: string;
  onAdd: (choice: TownChoice) => void;
  onCancel: () => void;
  blocked: (c: TownChoice) => string | null;
}) {
  const [name, setName] = useState(initialName.trim());
  const [state, setState] = useState("NJ");
  const choice = customChoice(name, state);
  const reason = choice ? blocked(choice) : null;
  return (
    <div className="max-w-sm space-y-2 rounded-xl border border-dashed border-line p-3">
      <p className="text-xs text-ink-subtle">For a place we couldn&apos;t find. It&apos;s saved as a custom location, not matched to Census data.</p>
      <div className="flex flex-wrap gap-2">
        <Input
          autoFocus
          aria-label="Location name"
          className="min-w-[10rem] flex-1"
          value={name}
          maxLength={60}
          placeholder="Town or city"
          onChange={(e) => setName(e.target.value)}
        />
        <Select aria-label="State" className="w-40" value={state} onChange={(e) => setState(e.target.value)}>
          {US_STATES.map((s) => (
            <option key={s.abbreviation} value={s.abbreviation}>
              {s.abbreviation} — {s.name}
            </option>
          ))}
        </Select>
      </div>
      {reason && <p className="text-xs text-critical">{reason}.</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={!choice || reason !== null} onClick={() => choice && onAdd(choice)}>
          Add location
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-accent/15 disabled:opacity-30"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}
