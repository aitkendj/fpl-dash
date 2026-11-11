/**
 * Sample FPL squad data - Team ID: 6906082
 * Realistic Premier League players with clubs, positions, prices, and points
 */
export type FPLPosition = "GK" | "DEF" | "MID" | "FWD"

export interface Player {
  id: number
  first_name: string
  second_name: string
  web_name: string
  position: FPLPosition
  team: number  // FPL team ID (1-20)
  now_price: number  // FPL native: tenths of £m (85 = £8.5m)
  form: number
  total_points: number
  minutes: number
  expected_points: number
  expected_minutes: number
  is_captain: boolean
  is_vice_captain: boolean
  status: "a" | "i" | "s" | "d"  // available, injured, suspended, doubtful
  squad_number?: number
  opposition?: number  // upcoming opponent FPL team ID
}

export interface SquadMember extends Player {
  in_team: boolean  // whether they're in the current selected squad
  is_substitute: boolean  // on the bench rather than in the starting XI
  selected_by_percent: number
  minutes_per_game: number
  last_gameweek_points: number  // points scored in the most recent GW
}

export const FPL_TEAM_ID = 6906082

/**
 * Premier League clubs using the official FPL team ids.
 * This is the mapping returned by the FPL bootstrap endpoint, so live
 * data can be joined against it without translation.
 */
export const PL_CLUBS = [
  { id: 1, name: "Arsenal", abbrev: "ARS" },
  { id: 2, name: "Aston Villa", abbrev: "AVL" },
  { id: 3, name: "Bournemouth", abbrev: "BOU" },
  { id: 4, name: "Brentford", abbrev: "BRE" },
  { id: 5, name: "Brighton", abbrev: "BHA" },
  { id: 6, name: "Chelsea", abbrev: "CHE" },
  { id: 7, name: "Crystal Palace", abbrev: "CRY" },
  { id: 8, name: "Everton", abbrev: "EVE" },
  { id: 9, name: "Fulham", abbrev: "FUL" },
  { id: 10, name: "Ipswich Town", abbrev: "IPS" },
  { id: 11, name: "Leicester City", abbrev: "LEI" },
  { id: 12, name: "Liverpool", abbrev: "LIV" },
  { id: 13, name: "Manchester City", abbrev: "MCI" },
  { id: 14, name: "Manchester United", abbrev: "MUN" },
  { id: 15, name: "Newcastle United", abbrev: "NEW" },
  { id: 16, name: "Nottingham Forest", abbrev: "NFO" },
  { id: 17, name: "Southampton", abbrev: "SOU" },
  { id: 18, name: "Tottenham Hotspur", abbrev: "TOT" },
  { id: 19, name: "West Ham United", abbrev: "WHU" },
  { id: 20, name: "Wolverhampton", abbrev: "WOL" },
] as const

/** Club name by FPL team id. */
export const PL_TEAM_NAMES: Record<number, string> = Object.fromEntries(
  PL_CLUBS.map((c) => [c.id, c.name])
)

/** Club abbreviation by FPL team id. */
export const PL_TEAM_ABBREV: Record<number, string> = Object.fromEntries(
  PL_CLUBS.map((c) => [c.id, c.abbrev])
)

/** Club record by FPL team id. */
export const PL_CLUB_BY_ID: Record<number, (typeof PL_CLUBS)[number]> =
  Object.fromEntries(PL_CLUBS.map((c) => [c.id, c]))

// My actual squad (Team ID 6906082) - realistic sample data
export const SQUAD: SquadMember[] = [
  // Starting XI - Formation: 3-4-3
  {
    id: 1,
    first_name: "David",
    second_name: "Raya",
    web_name: "Raya",
    position: "GK",
    team: 12,  // Liverpool
    now_price: 50,  // £5.0m
    form: 4.5,
    total_points: 168,
    minutes: 2700,
    expected_points: 6.5,
    expected_minutes: 90,
    is_captain: true,
    is_vice_captain: false,
    status: "a",
    squad_number: 1,
    opposition: 13,  // Man City
    in_team: true,
    is_substitute: false,
    last_gameweek_points: 7,
    selected_by_percent: 12.5,
    minutes_per_game: 90,
  },
  {
    id: 2,
    first_name: "William",
    second_name: "Saliba",
    web_name: "Saliba",
    position: "DEF",
    team: 12,  // Liverpool
    now_price: 45,  // £4.5m
    form: 3.8,
    total_points: 178,
    minutes: 2520,
    expected_points: 5.2,
    expected_minutes: 85,
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    squad_number: 5,
    opposition: 13,  // Man City
    in_team: true,
    is_substitute: false,
    last_gameweek_points: 6,
    selected_by_percent: 8.2,
    minutes_per_game: 90,
  },
  {
    id: 3,
    first_name: "Matthijs",
    second_name: "Kumler",
    web_name: "Kumler",
    position: "DEF",
    team: 1,  // Arsenal
    now_price: 52,  // £5.2m
    form: 4.2,
    total_points: 152,
    minutes: 2700,
    expected_points: 5.8,
    expected_minutes: 90,
    is_captain: false,
    is_vice_captain: true,
    status: "a",
    squad_number: 4,
    opposition: 6,   // Chelsea
    in_team: true,
    is_substitute: false,
    last_gameweek_points: 5,
    selected_by_percent: 9.1,
    minutes_per_game: 90,
  },
  {
    id: 4,
    first_name: "Trent",
    second_name: "Alexander-Arnold",
    web_name: "TAA",
    position: "DEF",
    team: 12,  // Liverpool
    now_price: 78,  // £7.8m
    form: 5.3,
    total_points: 215,
    minutes: 2700,
    expected_points: 7.1,
    expected_minutes: 90,
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    squad_number: 66,
    opposition: 13,  // Man City
    in_team: true,
    is_substitute: false,
    last_gameweek_points: 8,
    selected_by_percent: 15.3,
    minutes_per_game: 90,
  },
  {
    id: 5,
    first_name: "Bernardo",
    second_name: "Silva",
    web_name: "Bernardo",
    position: "MID",
    team: 1,  // Arsenal
    now_price: 72,  // £7.2m
    form: 4.8,
    total_points: 208,
    minutes: 2600,
    expected_points: 6.8,
    expected_minutes: 88,
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    squad_number: 20,
    opposition: 6,   // Chelsea
    in_team: true,
    is_substitute: false,
    last_gameweek_points: 6,
    selected_by_percent: 11.8,
    minutes_per_game: 87,
  },
  {
    id: 6,
    first_name: "Mohamed",
    second_name: "Salah",
    web_name: "Salah",
    position: "MID",
    team: 12,  // Liverpool
    now_price: 95,  // £9.5m
    form: 5.6,
    total_points: 246,
    minutes: 2700,
    expected_points: 8.2,
    expected_minutes: 90,
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    squad_number: 11,
    opposition: 6,   // Chelsea
    in_team: true,
    is_substitute: false,
    last_gameweek_points: 13,
    selected_by_percent: 18.5,
    minutes_per_game: 90,
  },
  {
    id: 7,
    first_name: "Ollie",
    second_name: "Watkins",
    web_name: "Watkins",
    position: "FWD",
    team: 2, // Aston Villa
    now_price: 78,  // £7.8m
    form: 4.9,
    total_points: 180,
    minutes: 2500,
    expected_points: 5.5,
    expected_minutes: 85,
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    squad_number: 19,
    opposition: 12,   // Liverpool
    in_team: true,
    is_substitute: false,
    last_gameweek_points: 7,
    selected_by_percent: 9.4,
    minutes_per_game: 83,
  },
  {
    id: 8,
    first_name: "Christopher",
    second_name: "Nkunku",
    web_name: "Nkunku",
    position: "MID",
    team: 13, // Manchester City
    now_price: 68,  // £6.8m
    form: 4.3,
    total_points: 158,
    minutes: 2200,
    expected_points: 5.1,
    expected_minutes: 70,
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    squad_number: 10,
    opposition: 12,   // Liverpool
    in_team: true,
    is_substitute: false,
    last_gameweek_points: 4,
    selected_by_percent: 7.2,
    minutes_per_game: 73,
  },
  {
    id: 9,
    first_name: "Ivan",
    second_name: "Toney",
    web_name: "Toney",
    position: "FWD",
    team: 6,  // Chelsea
    now_price: 65,  // £6.5m
    form: 4.1,
    total_points: 138,
    minutes: 2300,
    expected_points: 4.8,
    expected_minutes: 75,
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    squad_number: 9,
    opposition: 14,  // Man United
    in_team: true,
    is_substitute: false,
    last_gameweek_points: 2,
    selected_by_percent: 6.8,
    minutes_per_game: 77,
  },
  // Substitutes
  {
    id: 10,
    first_name: "Mark",
    second_name: "Sanchez",
    web_name: "Sanchez",
    position: "GK",
    team: 2, // Aston Villa
    now_price: 42,  // £4.2m
    form: 3.2,
    total_points: 22,
    minutes: 450,
    expected_points: 2.1,
    expected_minutes: 45,
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    squad_number: 22,
    opposition: 1,   // Arsenal
    in_team: true,
    is_substitute: true,
    last_gameweek_points: 0,
    selected_by_percent: 3.2,
    minutes_per_game: 23,
  },
  {
    id: 11,
    first_name: "Levi",
    second_name: "Coleman",
    web_name: "Coleman",
    position: "DEF",
    team: 1,  // Arsenal
    now_price: 48,  // £4.8m
    form: 3.5,
    total_points: 148,
    minutes: 1800,
    expected_points: 3.0,
    expected_minutes: 60,
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    squad_number: 33,
    opposition: 13,  // Man City
    in_team: true,
    is_substitute: true,
    last_gameweek_points: 0,
    selected_by_percent: 4.1,
    minutes_per_game: 60,
  },
  {
    id: 12,
    first_name: "Jacob",
    second_name: "Ramsey",
    web_name: "Ramsey",
    position: "MID",
    team: 13, // Manchester City
    now_price: 55,  // £5.5m
    form: 3.9,
    total_points: 156,
    minutes: 1500,
    expected_points: 3.8,
    expected_minutes: 55,
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    squad_number: 8,
    opposition: 12,   // Liverpool
    in_team: true,
    is_substitute: true,
    last_gameweek_points: 3,
    selected_by_percent: 5.5,
    minutes_per_game: 50,
  },
  {
    id: 13,
    first_name: "Ethan",
    second_name: "Nartey",
    web_name: "Nartey",
    position: "FWD",
    team: 6,  // Chelsea
    now_price: 58,  // £5.8m
    form: 3.4,
    total_points: 92,
    minutes: 1200,
    expected_points: 3.2,
    expected_minutes: 45,
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    squad_number: 25,
    opposition: 14,  // Man United
    in_team: true,
    is_substitute: false,
    last_gameweek_points: 1,
    selected_by_percent: 4.8,
    minutes_per_game: 40,
  },
  {
    id: 14,
    first_name: "Pervis",
    second_name: "Estupinan",
    web_name: "Estupinan",
    position: "DEF",
    team: 5, // Brighton
    now_price: 55, // £5.5m
    form: 4.0,
    total_points: 121,
    minutes: 2100,
    expected_points: 4.4,
    expected_minutes: 80,
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    squad_number: 30,
    opposition: 18, // Burnley
    in_team: true,
    is_substitute: true,
    last_gameweek_points: 0,
    selected_by_percent: 7.4,
    minutes_per_game: 75,
  },
  {
    id: 15,
    first_name: "Cole",
    second_name: "Palmer",
    web_name: "Palmer",
    position: "MID",
    team: 6, // Chelsea
    now_price: 63, // £6.3m
    form: 4.6,
    total_points: 196,
    minutes: 2350,
    expected_points: 6.0,
    expected_minutes: 85,
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    squad_number: 20,
    opposition: 14, // Man United
    in_team: true,
    is_substitute: false,
    last_gameweek_points: 9,
    selected_by_percent: 10.2,
    minutes_per_game: 79,
  },
]