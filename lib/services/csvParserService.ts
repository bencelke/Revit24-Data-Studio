import { CSV_IMPORT_CONFIG } from "@/lib/config/csv-import";
import type { CsvParseResult } from "@/lib/types/csv-import";

export function sanitizeCsvCell(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("=") || trimmed.startsWith("+") || trimmed.startsWith("-") || trimmed.startsWith("@")) {
    return `'${trimmed}`;
  }
  return trimmed;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(sanitizeCsvCell(current));
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(sanitizeCsvCell(current));
  return cells;
}

export function parseCsvContent(content: string): CsvParseResult {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    rows.push(row);
  }

  const limited = rows.slice(0, CSV_IMPORT_CONFIG.maxRows);

  return {
    headers,
    rows: limited,
    totalRows: limited.length,
  };
}

export function validateCsvFileSize(fileSize: number): string | null {
  if (fileSize > CSV_IMPORT_CONFIG.maxFileSizeBytes) {
    return `File exceeds the ${CSV_IMPORT_CONFIG.maxFileSizeBytes / (1024 * 1024)} MB limit.`;
  }
  return null;
}

export function validateCsvRowCount(rowCount: number): string | null {
  if (rowCount > CSV_IMPORT_CONFIG.maxRows) {
    return `CSV exceeds the ${CSV_IMPORT_CONFIG.maxRows.toLocaleString()} row limit.`;
  }
  if (rowCount === 0) {
    return "CSV file contains no data rows.";
  }
  return null;
}

export function generateCsvTemplate(): string {
  const headers = [
    "name", "type", "category", "country", "state", "city", "area", "address",
    "lat", "lng", "instagram", "facebook", "tiktok", "youtube", "website",
    "email", "phone", "description", "tags", "source_url", "status",
  ];
  const sample = [
    "BMW Club Stuttgart", "Club", "Car Club", "Germany", "Baden-Württemberg",
    "Stuttgart", "City Center", "Königstraße 1", "48.7758", "9.1829",
    "bmwclubstuttgart", "bmwclubstuttgart", "", "",
    "https://bmwclub-stuttgart.de", "hello@bmwclub-stuttgart.de", "+49 711 1234567",
    "Official BMW enthusiasts club", "BMW;Euro;Meet", "https://bmwclub-stuttgart.de", "active",
  ];
  return [headers.join(","), sample.map((cell) => `"${cell}"`).join(",")].join("\n");
}
