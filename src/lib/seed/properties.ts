import { z } from "zod";
import { propertySchema, type Property } from "@/lib/models";

/** Schema input type: nested fields are optional here, so partial seed data is allowed. */
type PropertyInput = Partial<z.input<typeof propertySchema>> & { address: string };

/**
 * Three clearly-labeled SAMPLE properties so the app is not empty on first run.
 * They are fictional (obvious placeholder addresses), flagged isSample, and can
 * be removed in one click from Settings. They deliberately span the guardrail
 * bands — comfortable, near-maximum, and beyond the walk-away limit — so the
 * warnings are visible immediately. No real listings are fabricated.
 */
function build(overrides: PropertyInput): Property {
  const ts = "2026-07-23T12:00:00.000Z";
  return propertySchema.parse({
    id: crypto.randomUUID(),
    createdAt: ts,
    updatedAt: ts,
    dateAdded: "2026-07-20",
    isSample: true,
    schools: {},
    ratings: {},
    finance: {},
    ...overrides,
  });
}

export function seedProperties(): Property[] {
  return [
    build({
      address: "10 Sample Orchard Way (SAMPLE)",
      town: "Princeton",
      zip: "08540",
      listingUrl: "",
      listingStatus: "active",
      status: "shortlisted",
      showingDate: "2026-08-15",
      askingPrice: 1_000_000,
      annualPropertyTaxes: 16_000,
      bedrooms: 4,
      bathrooms: 3,
      squareFootage: 2_600,
      lotSize: "0.34 acres",
      yearBuilt: 1998,
      hoaMonthly: 0,
      propertyType: "single-family",
      daysOnMarket: 12,
      stationName: "Princeton Junction",
      distanceToStation: "3.2 mi",
      parking: "ample",
      driveToStationMinutes: 12,
      doorToDoorCommuteMinutes: 80,
      trafficLevel: "low",
      schools: {
        elementary: "Community Park Elementary (verify)",
        middle: "Princeton Middle (verify)",
        high: "Princeton High (verify)",
        source: "Sample data — verify independently",
        verifiedDate: null,
        ratingMetric: "Example only — not verified",
        notes: "School boundaries and ratings must be independently verified.",
      },
      ratings: {
        schoolConfidence: 4,
        commute: 4,
        stationConvenience: 4,
        neighborhood: 5,
        layout: 4,
        condition: 4,
        resaleConfidence: 4,
        backyard: 4,
        frontYard: 3,
        primaryBedroom: 4,
        closet: 3,
        kitchen: 4,
      },
      finance: {
        // Renovation estimate deliberately left blank to show the "missing" flag.
        expectedDownPayment: 200_000,
      },
      neighborhoodNotes: "Quiet street, walkable to a small park. (Sample note.)",
    }),
    build({
      address: "22 Sample Ridge Terrace (SAMPLE)",
      town: "Summit",
      zip: "07901",
      listingStatus: "active",
      status: "interested",
      showingDate: "2026-08-22",
      askingPrice: 1_240_000,
      annualPropertyTaxes: 23_500,
      bedrooms: 4,
      bathrooms: 4,
      squareFootage: 3_000,
      lotSize: "0.28 acres",
      yearBuilt: 2005,
      hoaMonthly: 0,
      propertyType: "single-family",
      daysOnMarket: 5,
      stationName: "Summit",
      distanceToStation: "0.8 mi",
      parking: "permit-only",
      driveToStationMinutes: 6,
      doorToDoorCommuteMinutes: 70,
      trafficLevel: "moderate",
      schools: {
        elementary: "Sample Elementary (verify)",
        middle: "Summit Middle (verify)",
        high: "Summit High (verify)",
        source: "Sample data — verify independently",
        ratingMetric: "Example only — not verified",
        notes: "Confirm assigned schools with the district before relying on this.",
      },
      ratings: {
        schoolConfidence: 5,
        commute: 5,
        stationConvenience: 5,
        neighborhood: 4,
        layout: 4,
        condition: 3,
        resaleConfidence: 4,
        backyard: 3,
        primaryBedroom: 5,
        closet: 4,
      },
      finance: {
        expectedDownPayment: 215_000,
        immediateRenovationEstimate: 5_000,
      },
      neighborhoodNotes: "Close to the station; some road noise. (Sample note.)",
    }),
    build({
      address: "5 Sample Birch Court (SAMPLE)",
      town: "Ridgewood",
      zip: "07450",
      listingStatus: "active",
      status: "researching",
      askingPrice: 1_380_000,
      annualPropertyTaxes: 26_000,
      bedrooms: 5,
      bathrooms: 4,
      squareFootage: 3_400,
      lotSize: "0.4 acres",
      yearBuilt: 1962,
      hoaMonthly: 0,
      propertyType: "single-family",
      daysOnMarket: 41,
      stationName: "Ridgewood",
      distanceToStation: "1.1 mi",
      parking: "limited",
      driveToStationMinutes: 8,
      doorToDoorCommuteMinutes: 75,
      trafficLevel: "moderate",
      schools: {
        elementary: "Sample Elementary (verify)",
        middle: "Ridgewood Middle (verify)",
        high: "Ridgewood High (verify)",
        source: "Sample data — verify independently",
        ratingMetric: "Example only — not verified",
      },
      ratings: {
        schoolConfidence: 4,
        commute: 4,
        stationConvenience: 3,
        neighborhood: 4,
        layout: 3,
        condition: 2,
        resaleConfidence: 3,
        backyard: 5,
        primaryBedroom: 3,
        closet: 3,
      },
      finance: {
        expectedDownPayment: 250_000,
        immediateRenovationEstimate: 60_000,
      },
      neighborhoodNotes: "Larger lot but dated interior; would need real work. (Sample note.)",
      floodZoneNotes: "Not yet reviewed.",
    }),
  ];
}
