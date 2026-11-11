/**
 * Sample market data — players available to buy, outside the current squad.
 *
 * Mirrors the shape of the FPL bootstrap "elements" endpoint. Club ids are
 * the official FPL team ids (see PL_CLUBS in ./squad).
 */

export interface MarketPlayer {
  id: number
  first_name: string
  second_name: string
  web_name: string
  position: "GK" | "DEF" | "MID" | "FWD"
  team: number
  /** FPL native: tenths of £m (85 = £8.5m) */
  now_price: number
  form: number
  total_points: number
  expected_points: number
  expected_minutes: number
  /** Upcoming opponent (FPL team id) */
  opposition: number
  is_captain: boolean
  is_vice_captain: boolean
  status: "a" | "i" | "s" | "d"
  selected_by_percent: number
}

export const MARKET_PLAYERS: MarketPlayer[] = [
  {
    id: 101,
    first_name: "Erling",
    second_name: "Haaland",
    web_name: "Haaland",
    position: "FWD",
    team: 13, // Manchester City
    now_price: 115, // £11.5m
    form: 6.2,
    total_points: 145,
    expected_points: 9.1,
    expected_minutes: 90,
    opposition: 12, // Liverpool
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 31.4,
  },
  {
    id: 102,
    first_name: "Bukayo",
    second_name: "Saka",
    web_name: "Saka",
    position: "MID",
    team: 1, // Arsenal
    now_price: 85, // £8.5m
    form: 5.1,
    total_points: 115,
    expected_points: 7.8,
    expected_minutes: 90,
    opposition: 6, // Chelsea
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 26.8,
  },
  {
    id: 103,
    first_name: "Alexander",
    second_name: "Isak",
    web_name: "Isak",
    position: "FWD",
    team: 15, // Newcastle United
    now_price: 92, // £9.2m
    form: 5.6,
    total_points: 112,
    expected_points: 7.4,
    expected_minutes: 88,
    opposition: 18, // Tottenham
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 19.2,
  },
  {
    id: 104,
    first_name: "Martin",
    second_name: "Odegaard",
    web_name: "Odegaard",
    position: "MID",
    team: 1, // Arsenal
    now_price: 82, // £8.2m
    form: 5.0,
    total_points: 108,
    expected_points: 6.8,
    expected_minutes: 90,
    opposition: 6, // Chelsea
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 22.1,
  },
  {
    id: 105,
    first_name: "Bruno",
    second_name: "Fernandes",
    web_name: "Fernandes",
    position: "MID",
    team: 1, // Arsenal
    now_price: 78, // £7.8m
    form: 4.7,
    total_points: 102,
    expected_points: 6.2,
    expected_minutes: 88,
    opposition: 14, // Manchester United
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 17.5,
  },
  {
    id: 107,
    first_name: "Rasmus",
    second_name: "Hojlund",
    web_name: "Hojlund",
    position: "FWD",
    team: 14, // Manchester United
    now_price: 74, // £7.4m
    form: 4.8,
    total_points: 96,
    expected_points: 6.1,
    expected_minutes: 85,
    opposition: 6, // Chelsea
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 15.3,
  },
  {
    id: 108,
    first_name: "Son",
    second_name: "Heung-min",
    web_name: "Son",
    position: "FWD",
    team: 1, // Arsenal
    now_price: 62, // £6.2m
    form: 4.0,
    total_points: 78,
    expected_points: 5.6,
    expected_minutes: 75,
    opposition: 14, // Manchester United
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 21.2,
  },
  {
    id: 109,
    first_name: "Diogo",
    second_name: "Jota",
    web_name: "Jota",
    position: "MID",
    team: 12, // Liverpool
    now_price: 58, // £5.8m
    form: 4.2,
    total_points: 88,
    expected_points: 5.5,
    expected_minutes: 75,
    opposition: 13, // Manchester City
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 18.6,
  },
  {
    id: 112,
    first_name: "Ruben",
    second_name: "Dias",
    web_name: "Dias",
    position: "DEF",
    team: 13, // Manchester City
    now_price: 76, // £7.6m
    form: 4.6,
    total_points: 99,
    expected_points: 5.0,
    expected_minutes: 88,
    opposition: 12, // Liverpool
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 14.8,
  },
  {
    id: 113,
    first_name: "Josko",
    second_name: "Gvardiol",
    web_name: "Gvardiol",
    position: "DEF",
    team: 12, // Liverpool
    now_price: 68, // £6.8m
    form: 4.4,
    total_points: 92,
    expected_points: 4.8,
    expected_minutes: 82,
    opposition: 13, // Manchester City
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 12.1,
  },
  {
    id: 114,
    first_name: "Jarrad",
    second_name: "Branthwaite",
    web_name: "Branthwaite",
    position: "DEF",
    team: 8, // Everton
    now_price: 52, // £5.2m
    form: 3.9,
    total_points: 74,
    expected_points: 3.8,
    expected_minutes: 75,
    opposition: 2, // Aston Villa
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 9.4,
  },
  {
    id: 115,
    first_name: "Emerson",
    second_name: "Royal",
    web_name: "Royal",
    position: "DEF",
    team: 2, // Aston Villa
    now_price: 48, // £4.8m
    form: 3.6,
    total_points: 70,
    expected_points: 3.4,
    expected_minutes: 72,
    opposition: 1, // Arsenal
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 8.2,
  },
  {
    id: 116,
    first_name: "Gabriel",
    second_name: "Magalhaes",
    web_name: "Magalhaes",
    position: "DEF",
    team: 1, // Arsenal
    now_price: 45, // £4.5m
    form: 3.3,
    total_points: 62,
    expected_points: 3.2,
    expected_minutes: 70,
    opposition: 13, // Manchester City
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 7.9,
  },
  {
    id: 118,
    first_name: "Jordan",
    second_name: "Pickford",
    web_name: "Pickford",
    position: "GK",
    team: 8, // Everton
    now_price: 55, // £5.5m
    form: 4.1,
    total_points: 108,
    expected_points: 5.8,
    expected_minutes: 90,
    opposition: 2, // Aston Villa
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 10.8,
  },
  {
    id: 119,
    first_name: "Lucas",
    second_name: "Paqueta",
    web_name: "Paqueta",
    position: "MID",
    team: 19, // West Ham United
    now_price: 54, // £5.4m
    form: 3.7,
    total_points: 71,
    expected_points: 4.1,
    expected_minutes: 70,
    opposition: 14, // Manchester United
    is_captain: false,
    is_vice_captain: false,
    status: "a",
    selected_by_percent: 9.6,
  },
]
