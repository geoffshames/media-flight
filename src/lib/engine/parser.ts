import type { ParsedMarketUpdate } from '@/lib/types/flight';
import type { Market } from '@/lib/types/flight';
import * as XLSX from 'xlsx';

interface ParseResult {
  updates: ParsedMarketUpdate[];
  confidence: 'high' | 'medium' | 'low';
  unmatchedRows: string[];
  warnings: string[];
}

/**
 * Parse an uploaded spreadsheet and extract ticket count updates.
 * Tries multiple strategies since promoter reports come in wildly different formats.
 */
export function parseUploadedFile(
  file: ArrayBuffer,
  existingMarkets: Market[]
): ParseResult {
  const workbook = XLSX.read(file, { type: 'array', cellDates: true });
  const warnings: string[] = [];
  const unmatchedRows: string[] = [];

  // Try each sheet
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (raw.length < 2) continue;

    // Strategy 1: Try to find a header row with city/count columns
    const headerResult = tryHeaderBasedParse(raw, existingMarkets, warnings);
    if (headerResult && headerResult.updates.length > 0) {
      return { ...headerResult, unmatchedRows, warnings };
    }

    // Strategy 2: Try matching by city name in any column
    const cityMatchResult = tryCityMatchParse(raw, existingMarkets, warnings);
    if (cityMatchResult && cityMatchResult.updates.length > 0) {
      return { ...cityMatchResult, unmatchedRows, warnings };
    }
  }

  warnings.push('Could not automatically parse the spreadsheet. Please use manual entry.');
  return { updates: [], confidence: 'low', unmatchedRows, warnings };
}

/**
 * Strategy 1: Find a header row and extract data from named columns.
 */
function tryHeaderBasedParse(
  rows: unknown[][],
  existingMarkets: Market[],
  warnings: string[]
): ParseResult | null {
  // Scan first 20 rows for a header
  const maxScan = Math.min(20, rows.length);
  for (let headerIdx = 0; headerIdx < maxScan; headerIdx++) {
    const row = rows[headerIdx];
    if (!row || row.length < 2) continue;

    const headerStrings = row.map(cell => String(cell ?? '').toLowerCase().trim());

    // Look for city-like and count-like columns
    const cityCol = headerStrings.findIndex(h =>
      /\b(city|market|venue|location)\b/.test(h)
    );
    const countCol = headerStrings.findIndex(h =>
      /\b(sold|tickets|count|total|current)\b/.test(h)
    );
    const capacityCol = headerStrings.findIndex(h =>
      /\b(capacity|cap|sellable|avail)\b/.test(h)
    );

    if (cityCol === -1 || countCol === -1) continue;

    // Found a header — parse data rows
    const updates: ParsedMarketUpdate[] = [];
    const cityLookup = buildCityLookup(existingMarkets);

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const dataRow = rows[i];
      if (!dataRow || !dataRow[cityCol]) continue;

      const cityRaw = String(dataRow[cityCol]).trim();
      const countRaw = dataRow[countCol];
      const ticketsSold = parseNumeric(countRaw);

      if (ticketsSold === null) continue;

      const matchedCity = fuzzyMatchCity(cityRaw, cityLookup);
      if (matchedCity) {
        const update: ParsedMarketUpdate = { city: matchedCity, ticketsSold };
        if (capacityCol !== -1) {
          const cap = parseNumeric(dataRow[capacityCol]);
          if (cap !== null) update.capacity = cap;
        }
        updates.push(update);
      } else {
        warnings.push(`Could not match "${cityRaw}" to an existing market`);
      }
    }

    if (updates.length > 0) {
      const confidence = updates.length >= existingMarkets.length * 0.5 ? 'high' : 'medium';
      return { updates, confidence, unmatchedRows: [], warnings };
    }
  }

  return null;
}

/**
 * Strategy 2: Scan all cells for city names that match existing markets,
 * then look for numbers nearby that could be ticket counts.
 */
function tryCityMatchParse(
  rows: unknown[][],
  existingMarkets: Market[],
  warnings: string[]
): ParseResult | null {
  const cityLookup = buildCityLookup(existingMarkets);
  const updates: ParsedMarketUpdate[] = [];
  const matched = new Set<string>();

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    for (let c = 0; c < row.length; c++) {
      const cellStr = String(row[c] ?? '').trim();
      if (!cellStr || cellStr.length < 3) continue;

      const matchedCity = fuzzyMatchCity(cellStr, cityLookup);
      if (!matchedCity || matched.has(matchedCity)) continue;

      // Look for a number in the same row (to the right of city, or anywhere)
      for (let nc = c + 1; nc < row.length; nc++) {
        const num = parseNumeric(row[nc]);
        if (num !== null && num > 0 && num < 200000) {
          updates.push({ city: matchedCity, ticketsSold: num });
          matched.add(matchedCity);
          break;
        }
      }
    }
  }

  if (updates.length > 0) {
    const confidence: ParseResult['confidence'] = updates.length >= existingMarkets.length * 0.7 ? 'medium' : 'low';
    if (updates.length < existingMarkets.length) {
      warnings.push(`Only matched ${updates.length} of ${existingMarkets.length} markets`);
    }
    return { updates, confidence, unmatchedRows: [], warnings };
  }

  return null;
}

// ── Helpers ──

function buildCityLookup(markets: Market[]): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const m of markets) {
    lookup.set(m.city.toLowerCase(), m.city);
    // Also add without accents, with common abbreviations
    const normalized = m.city.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    lookup.set(normalized, m.city);
  }
  return lookup;
}

function fuzzyMatchCity(input: string, lookup: Map<string, string>): string | null {
  const normalized = input.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Exact match
  if (lookup.has(normalized)) return lookup.get(normalized)!;

  // Substring match
  let match: string | null = null;
  lookup.forEach((city, key) => {
    if (!match && (normalized.includes(key) || key.includes(normalized))) {
      match = city;
    }
  });
  if (match) return match;

  return null;
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === 'number') return Math.round(value);
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,$\s%]/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? null : Math.round(num);
  }
  return null;
}
