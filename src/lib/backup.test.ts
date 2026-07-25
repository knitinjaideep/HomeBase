import { describe, it, expect } from "vitest";
import { parseBackup, summarizeBackup, backupFileName } from "./backup";
import { backupSchema, CURRENT_SCHEMA_VERSION, type Backup } from "./models";
import {
  seedAppSettings,
  seedFinancialProfile,
  seedHomePreferences,
  seedHouseholdProfile,
  seedProperties,
} from "./seed";

function validBackup(): Backup {
  const ts = "2026-07-23T00:00:00.000Z";
  return {
    app: "HomeScope",
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: ts,
    data: {
      householdProfile: [seedHouseholdProfile(ts)],
      financialProfile: [seedFinancialProfile(ts)],
      homePreferences: [seedHomePreferences(ts)],
      appSettings: [seedAppSettings(ts)],
      properties: seedProperties(),
      visits: [],
      scenarios: [],
      lenderQuotes: [],
      checklists: [],
      tasks: [],
      towns: [],
      journeyStages: [],
      journeyActions: [],
      journeyDecisions: [],
      attendingTransition: [],
      mortgageApprovals: [],
      professionals: [],
      resources: [],
      documents: [],
      deals: [],
    },
  };
}

describe("parseBackup", () => {
  it("accepts a well-formed backup and round-trips through JSON", () => {
    const backup = validBackup();
    const text = JSON.stringify(backup);
    const result = parseBackup(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.data.properties.length).toBe(3);
      expect(result.backup.app).toBe("HomeScope");
    }
  });

  it("rejects non-JSON text", () => {
    const result = parseBackup("not json {");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("valid JSON");
  });

  it("rejects JSON that is not a HomeScope backup", () => {
    const result = parseBackup(JSON.stringify({ hello: "world" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("HomeScope backup");
  });

  it("rejects a backup with a malformed property", () => {
    const backup = validBackup();
    // Corrupt: remove the required address from a property.
    const broken = JSON.parse(JSON.stringify(backup));
    delete broken.data.properties[0].address;
    const result = parseBackup(JSON.stringify(broken));
    expect(result.ok).toBe(false);
  });
});

describe("summarizeBackup", () => {
  it("counts entities for the preview", () => {
    const summary = summarizeBackup(validBackup().data);
    const properties = summary.find((s) => s.label === "Properties");
    expect(properties?.count).toBe(3);
  });
});

describe("backupFileName", () => {
  it("produces a timestamped filename", () => {
    const name = backupFileName(new Date("2026-07-23T20:14:00"));
    expect(name).toBe("homescope-backup-2026-07-23-2014.json");
  });
});

describe("backupSchema", () => {
  it("is the same schema used by parseBackup", () => {
    expect(backupSchema.safeParse(validBackup()).success).toBe(true);
  });
});
