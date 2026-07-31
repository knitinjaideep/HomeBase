import { describe, it, expect } from "vitest";
import { ownedHomeSchema } from "./home";

function base() {
  return { id: "h1", createdAt: "2026-07-28T00:00:00.000Z", updatedAt: "2026-07-28T00:00:00.000Z" };
}

describe("ownedHomeSchema", () => {
  it("is usable with just a name", () => {
    const home = ownedHomeSchema.parse({ ...base(), name: "Our Home" });
    expect(home.name).toBe("Our Home");
    expect(home.address).toBe("");
    expect(home.yearBuilt).toBeNull();
    expect(home.systems).toEqual([]);
  });

  it("is usable with just an address", () => {
    const home = ownedHomeSchema.parse({ ...base(), address: "12 Maple St" });
    expect(home.address).toBe("12 Maple St");
    expect(home.name).toBe("");
  });

  it("is usable with nothing at all beyond the base fields", () => {
    const home = ownedHomeSchema.parse(base());
    expect(home.name).toBe("");
    expect(home.address).toBe("");
  });

  it("keeps purchase details and systems when provided", () => {
    const home = ownedHomeSchema.parse({
      ...base(),
      purchaseDate: "2021-06-15",
      purchasePrice: 450000,
      yearBuilt: 1998,
      systems: [{ id: "s1", label: "HVAC", notes: "Carrier, installed 2019" }],
    });
    expect(home.purchasePrice).toBe(450000);
    expect(home.yearBuilt).toBe(1998);
    expect(home.systems).toHaveLength(1);
    expect(home.systems[0].label).toBe("HVAC");
  });

  it("does not carry propertyType or moveInDate — those live on ownerModeProfile", () => {
    const home = ownedHomeSchema.parse({ ...base(), name: "x" });
    expect(home).not.toHaveProperty("propertyType");
    expect(home).not.toHaveProperty("moveInDate");
  });
});
