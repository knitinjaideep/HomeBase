"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/util";
import { Button, Input, Select } from "@/components/ui";
import { US_STATES } from "@/lib/journey/town-reference";
import {
  choiceFromReference,
  customChoice,
  formatTown,
  sameTown,
  searchTowns,
  type TownChoice,
} from "@/lib/journey/towns";

/**
 * Searchable multi-select for towns. Shows the chosen towns as cards (custom
 * ones are labelled), a search box matching town name or state, and "Add another
 * location" for anything missing from the reference list. Towns already chosen
 * elsewhere (`taken`) show up in results but cannot be picked twice.
 * Controlled: value in, onChange out, nothing saved here.
 */
export function TownPicker({
  label,
  value,
  onChange,
  taken,
  takenLabel,
  reorderable = false,
}: {
  label: string;
  value: TownChoice[];
  onChange: (next: TownChoice[]) => void;
  /** Towns chosen in the other list; they cannot be added here. */
  taken: TownChoice[];
  /** Where those towns are, e.g. "In backup towns". */
  takenLabel: string;
  reorderable?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState(false);
  const listId = useId();
  const results = searchTowns(query);
  const add = (choice: TownChoice) => {
    if (!value.some((v) => sameTown(v, choice)) && !taken.some((t) => sameTown(t, choice))) onChange([...value, choice]);
    setQuery("");
  };
  const move = (index: number, by: -1 | 1) => {
    const next = [...value];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {value.map((t, i) => (
            <li key={`${t.refId ?? t.name}-${t.state}`} className="flex items-center gap-1 rounded-xl border border-accent/40 bg-accent-soft py-1.5 pl-3 pr-1.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {reorderable && value.length > 1 && <span className="mr-1.5 text-xs text-ink-subtle">{i + 1}.</span>}
                  {formatTown(t)}
                </p>
                {t.isCustom && <p className="text-xs text-ink-subtle">Custom location</p>}
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
          aria-label={`Search towns — ${label}`}
          aria-expanded={query.trim() !== ""}
          aria-controls={listId}
          value={query}
          maxLength={60}
          placeholder="Search by town or state, e.g. Princeton, NJ"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const first = results.map(choiceFromReference).find((c) => !taken.some((t) => sameTown(t, c)));
              if (first) add(first);
            } else if (e.key === "Escape") setQuery("");
          }}
        />
        {query.trim() !== "" && (
          <ul
            id={listId}
            role="listbox"
            aria-label="Matching towns"
            className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-surface py-1 shadow-lg"
          >
            {results.map((r) => {
              const choice = choiceFromReference(r);
              const isTaken = taken.some((t) => sameTown(t, choice));
              const chosen = value.some((v) => sameTown(v, choice));
              return (
                <li key={r.id} role="option" aria-selected={chosen} aria-disabled={isTaken || chosen}>
                  <button
                    type="button"
                    disabled={isTaken || chosen}
                    onClick={() => add(choice)}
                    className={cn(
                      "flex min-h-[44px] w-full items-center justify-between px-3 text-left text-sm",
                      isTaken || chosen ? "text-ink-subtle" : "text-ink hover:bg-accent-soft",
                    )}
                  >
                    {formatTown(choice)}
                    {(isTaken || chosen) && <span className="text-xs">{chosen ? "Added" : takenLabel}</span>}
                  </button>
                </li>
              );
            })}
            {results.length === 0 && <li className="px-3 py-2 text-sm text-ink-subtle">No matching towns.</li>}
            <li role="presentation" className="border-t border-line">
              <button
                type="button"
                onClick={() => setCustom(true)}
                className="flex min-h-[44px] w-full items-center px-3 text-left text-sm text-accent hover:bg-accent-soft"
              >
                Add another location…
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
          isTaken={(c) => taken.some((t) => sameTown(t, c))}
          takenLabel={takenLabel}
        />
      ) : (
        query.trim() === "" && (
          <button type="button" onClick={() => setCustom(true)} className="text-sm text-ink-muted underline-offset-2 hover:text-accent hover:underline">
            Add another location
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
  isTaken,
  takenLabel,
}: {
  initialName: string;
  onAdd: (choice: TownChoice) => void;
  onCancel: () => void;
  isTaken: (c: TownChoice) => boolean;
  takenLabel: string;
}) {
  const [name, setName] = useState(initialName.trim());
  const [state, setState] = useState("NJ");
  const choice = customChoice(name, state);
  const duplicate = choice ? isTaken(choice) : false;
  return (
    <div className="max-w-sm space-y-2 rounded-xl border border-dashed border-line p-3">
      <p className="text-xs text-ink-subtle">A location that isn&apos;t in our list. It&apos;s saved as a custom location.</p>
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
          {Object.entries(US_STATES).map(([code, full]) => (
            <option key={code} value={code}>
              {code} — {full}
            </option>
          ))}
        </Select>
      </div>
      {duplicate && <p className="text-xs text-critical">{takenLabel}.</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={!choice || duplicate} onClick={() => choice && onAdd(choice)}>
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
