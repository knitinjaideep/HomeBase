/**
 * U.S. states and DC with their Census FIPS codes. `--state=NY` in the sync
 * command and the state filter in search both resolve through here, so adding
 * a state to the app needs no code change.
 */

export interface UsState {
  abbreviation: string;
  /** Two-digit Census state FIPS code. */
  fips: string;
  name: string;
}

export const US_STATES: readonly UsState[] = [
  { abbreviation: "AL", fips: "01", name: "Alabama" },
  { abbreviation: "AK", fips: "02", name: "Alaska" },
  { abbreviation: "AZ", fips: "04", name: "Arizona" },
  { abbreviation: "AR", fips: "05", name: "Arkansas" },
  { abbreviation: "CA", fips: "06", name: "California" },
  { abbreviation: "CO", fips: "08", name: "Colorado" },
  { abbreviation: "CT", fips: "09", name: "Connecticut" },
  { abbreviation: "DE", fips: "10", name: "Delaware" },
  { abbreviation: "DC", fips: "11", name: "District of Columbia" },
  { abbreviation: "FL", fips: "12", name: "Florida" },
  { abbreviation: "GA", fips: "13", name: "Georgia" },
  { abbreviation: "HI", fips: "15", name: "Hawaii" },
  { abbreviation: "ID", fips: "16", name: "Idaho" },
  { abbreviation: "IL", fips: "17", name: "Illinois" },
  { abbreviation: "IN", fips: "18", name: "Indiana" },
  { abbreviation: "IA", fips: "19", name: "Iowa" },
  { abbreviation: "KS", fips: "20", name: "Kansas" },
  { abbreviation: "KY", fips: "21", name: "Kentucky" },
  { abbreviation: "LA", fips: "22", name: "Louisiana" },
  { abbreviation: "ME", fips: "23", name: "Maine" },
  { abbreviation: "MD", fips: "24", name: "Maryland" },
  { abbreviation: "MA", fips: "25", name: "Massachusetts" },
  { abbreviation: "MI", fips: "26", name: "Michigan" },
  { abbreviation: "MN", fips: "27", name: "Minnesota" },
  { abbreviation: "MS", fips: "28", name: "Mississippi" },
  { abbreviation: "MO", fips: "29", name: "Missouri" },
  { abbreviation: "MT", fips: "30", name: "Montana" },
  { abbreviation: "NE", fips: "31", name: "Nebraska" },
  { abbreviation: "NV", fips: "32", name: "Nevada" },
  { abbreviation: "NH", fips: "33", name: "New Hampshire" },
  { abbreviation: "NJ", fips: "34", name: "New Jersey" },
  { abbreviation: "NM", fips: "35", name: "New Mexico" },
  { abbreviation: "NY", fips: "36", name: "New York" },
  { abbreviation: "NC", fips: "37", name: "North Carolina" },
  { abbreviation: "ND", fips: "38", name: "North Dakota" },
  { abbreviation: "OH", fips: "39", name: "Ohio" },
  { abbreviation: "OK", fips: "40", name: "Oklahoma" },
  { abbreviation: "OR", fips: "41", name: "Oregon" },
  { abbreviation: "PA", fips: "42", name: "Pennsylvania" },
  { abbreviation: "RI", fips: "44", name: "Rhode Island" },
  { abbreviation: "SC", fips: "45", name: "South Carolina" },
  { abbreviation: "SD", fips: "46", name: "South Dakota" },
  { abbreviation: "TN", fips: "47", name: "Tennessee" },
  { abbreviation: "TX", fips: "48", name: "Texas" },
  { abbreviation: "UT", fips: "49", name: "Utah" },
  { abbreviation: "VT", fips: "50", name: "Vermont" },
  { abbreviation: "VA", fips: "51", name: "Virginia" },
  { abbreviation: "WA", fips: "53", name: "Washington" },
  { abbreviation: "WV", fips: "54", name: "West Virginia" },
  { abbreviation: "WI", fips: "55", name: "Wisconsin" },
  { abbreviation: "WY", fips: "56", name: "Wyoming" },
];

const BY_ABBREVIATION = new Map(US_STATES.map((s) => [s.abbreviation, s]));
const BY_FIPS = new Map(US_STATES.map((s) => [s.fips, s]));

/** Accepts "NJ" / "nj"; returns undefined for anything that is not a state. */
export function stateByAbbreviation(value: string): UsState | undefined {
  return BY_ABBREVIATION.get(value.trim().toUpperCase());
}

export function stateByFips(fips: string): UsState | undefined {
  return BY_FIPS.get(fips);
}
