// The Odds API integration
// Usamos la API key de las variables de entorno
// No accedemos directamente a process.env, sino que obtenemos la clave del servidor
const BASE_URL = 'https://api.the-odds-api.com/v4';

// Types for sports data
export interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface Market {
  key: string;
  outcomes: Outcome[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface EventOdds {
  id: string;
  sport_key: string;
  sport_title?: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

/**
 * Fetches available sports from The Odds API
 */
export async function fetchSports(): Promise<Sport[]> {
  try {
    const response = await fetch(`${BASE_URL}/sports/?apiKey=${API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sports:', error);
    throw error;
  }
}

/**
 * Fetches upcoming events and odds for a specific sport
 */
export async function fetchOdds(
  sportKey: string,
  regions: string = 'us',
  markets: string = 'h2h',
  oddsFormat: string = 'decimal'
): Promise<EventOdds[]> {
  try {
    const url = `${BASE_URL}/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching odds for ${sportKey}:`, error);
    throw error;
  }
}

/**
 * Fetches upcoming events across all sports
 */
export async function fetchUpcomingEvents(
  regions: string = 'us',
  markets: string = 'h2h',
  oddsFormat: string = 'decimal'
): Promise<EventOdds[]> {
  try {
    const url = `${BASE_URL}/sports/upcoming/odds/?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    throw error;
  }
}

/**
 * Formats odds to decimal format with two decimal places
 * Converts American odds to decimal format:
 * - Positive odds (e.g. +200): (odds / 100) + 1
 * - Negative odds (e.g. -150): (100 / |odds|) + 1
 * 
 * @param odds American odds value
 * @param showInfo Whether to show additional information about the odds
 * @returns Formatted decimal odds string
 */
export function formatAmericanOdds(odds: number, showInfo: boolean = false): string {
  let decimalOdds: number;
  
  if (odds > 0) {
    // Convertir cuota positiva a decimal: (cuota/100) + 1
    decimalOdds = (odds / 100) + 1;
  } else {
    // Convertir cuota negativa a decimal: (100/|cuota|) + 1
    decimalOdds = (100 / Math.abs(odds)) + 1;
  }
  
  // Formatear a dos decimales
  const formattedOdds = decimalOdds.toFixed(2);
  
  if (showInfo) {
    const impliedProb = ((1 / decimalOdds) * 100).toFixed(1);
    return `${formattedOdds} (${impliedProb}%)`;
  }
  
  return formattedOdds;
}

/**
 * Converts American odds to implied probability
 * 
 * @param odds American odds value
 * @returns Implied probability as a percentage
 */
export function oddsToImpliedProbability(odds: number): number {
  if (odds > 0) {
    // Positive odds formula: 100 / (odds + 100)
    return 100 / (odds + 100);
  } else {
    // Negative odds formula: |odds| / (|odds| + 100)
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

/**
 * Converts ISO date to a more readable format
 */
export function formatEventDate(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Extracts the best odds for an event from multiple bookmakers
 */
export function getBestOdds(event: EventOdds, marketKey: string = 'h2h'): { [team: string]: number } {
  const bestOdds: { [team: string]: number } = {};
  
  // Initialize with home and away team
  bestOdds[event.home_team] = 0;
  bestOdds[event.away_team] = 0;
  
  // Check all bookmakers for the best odds
  for (const bookmaker of event.bookmakers) {
    const market = bookmaker.markets.find(m => m.key === marketKey);
    
    if (market) {
      for (const outcome of market.outcomes) {
        // If better odds found, update
        if (!bestOdds[outcome.name] || outcome.price > bestOdds[outcome.name]) {
          bestOdds[outcome.name] = outcome.price;
        }
      }
    }
  }
  
  return bestOdds;
}

/**
 * Gets a color for each sport type for UI styling
 */
export function getSportColor(sportGroup: string): string {
  const colors: {[key: string]: string} = {
    'Soccer': '#1e88e5',
    'Basketball': '#d32f2f',
    'Tennis': '#ff9800',
    'American Football': '#8bc34a',
    'Baseball': '#ff5722',
    'Ice Hockey': '#03a9f4',
    'Mixed Martial Arts': '#9c27b0',
    'Rugby League': '#795548',
    'Aussie Rules': '#ffc107',
    'Cricket': '#2196f3',
    'Golf': '#4caf50',
  };
  
  return colors[sportGroup] || '#607d8b'; // Default color
}