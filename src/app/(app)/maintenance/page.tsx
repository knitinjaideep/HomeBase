import { Panel, EmptyState } from "@/components/ui";
import { NoteContextPanel } from "@/components/notes/note-context-panel";

/**
 * The tracking itself (recurring tasks, warranties, a maintenance-item data
 * model) is still future work — see docs/WORKSPACE_MODE.md. What this page
 * adds now is a place to jot notes about maintenance so nothing gets lost in
 * the meantime; those notes carry a "maintenanceItem" context (see
 * lib/models/note.ts) so once real maintenance records exist, nothing about
 * how they're captured needs to change.
 */
export default function MaintenancePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Maintenance</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-base">
          Tracking for your home&rsquo;s systems, seasonal tasks, and warranties.
        </p>
      </div>

      <div className="mb-8">
        <NoteContextPanel contextType="maintenanceItem" contextId={null} title="Maintenance notes" />
      </div>

      <Panel className="p-5 sm:p-6">
        <EmptyState
          title="Maintenance tracking is coming soon"
          description="This will hold your home's recurring tasks (filters, gutters, HVAC service), appliance and system warranties, and a simple history of what's been done and when."
        />
      </Panel>
    </div>
  );
}
