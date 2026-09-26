/**
 * Bundled reference list of towns the town selector searches. Deliberately
 * small: New Jersey municipalities buyers commonly shortlist. Anything missing
 * is added by the household as a custom location, so this list never has to be
 * complete — extend it by adding a name to `NJ_TOWNS`.
 *
 * Each entry gets a canonical id (`nj-west-windsor`) that is stored on the
 * household's town row, so later features can join on it instead of on a
 * free-text name.
 */

export interface ReferenceTown {
  /** Canonical id, e.g. "nj-princeton". */
  id: string;
  name: string;
  /** Two-letter state code. */
  state: string;
}

export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const NJ_TOWNS = [
  "Allendale", "Asbury Park", "Basking Ridge", "Bedminster", "Belmar", "Bernardsville", "Bloomfield", "Bloomsbury",
  "Bordentown", "Bound Brook", "Branchburg", "Bridgewater", "Caldwell", "Califon", "Cedar Grove", "Chatham",
  "Cherry Hill", "Clark", "Clinton", "Cranbury", "Cranford", "Denville", "Dunellen", "East Brunswick", "Edison",
  "Englewood", "Fair Haven", "Fair Lawn", "Fanwood", "Far Hills", "Flemington", "Franklin Lakes", "Freehold",
  "Garwood", "Glen Ridge", "Glen Rock", "Hackensack", "Haddonfield", "Hamilton", "Hasbrouck Heights", "Hillsborough",
  "Hoboken", "Holmdel", "Hopewell", "Hopewell Township", "Howell", "Jersey City", "Kenilworth", "Lambertville",
  "Lawrenceville", "Lebanon", "Little Silver", "Livingston", "Madison", "Mahwah", "Manalapan", "Maplewood",
  "Marlboro", "Matawan", "Metuchen", "Middletown", "Millburn", "Millstone", "Monroe", "Montclair", "Montgomery",
  "Montvale", "Moorestown", "Morris Plains", "Morristown", "Mountain Lakes", "Mountainside", "New Brunswick",
  "New Providence", "Newark", "North Brunswick", "Nutley", "Oakland", "Old Tappan", "Paramus", "Park Ridge",
  "Pennington", "Piscataway", "Plainfield", "Plainsboro", "Princeton", "Princeton Junction", "Randolph",
  "Red Bank", "Ridgewood", "Ringwood", "River Vale", "Rocky Hill", "Roseland", "Rumson", "Rutherford",
  "Scotch Plains", "Sea Girt", "Short Hills", "Skillman", "Somerville", "South Brunswick", "South Orange",
  "South Plainfield", "Springfield", "Summit", "Tenafly", "Titusville", "Toms River", "Union", "Verona",
  "Warren", "Watchung", "Wayne", "Westfield", "West Orange", "West Windsor", "Wyckoff", "Woodbridge",
];

/** "West Windsor" + "NJ" → "nj-west-windsor". */
export function townRefId(name: string, state: string): string {
  const slug = name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${state.toLowerCase()}-${slug}`;
}

export const REFERENCE_TOWNS: ReferenceTown[] = NJ_TOWNS.map((name) => ({
  id: townRefId(name, "NJ"),
  name,
  state: "NJ",
}));

const BY_ID = new Map(REFERENCE_TOWNS.map((t) => [t.id, t]));

export function referenceTownById(id: string | null | undefined): ReferenceTown | undefined {
  return id ? BY_ID.get(id) : undefined;
}
