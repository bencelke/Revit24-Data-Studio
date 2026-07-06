import type { SimpleExtractedProfile } from "@/lib/types/simpleInstagramImport";

function escapeCsvValue(value: string | null | undefined): string {
  const safe = value ?? "";
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function buildSimpleInstagramCsv(rows: SimpleExtractedProfile[]): string {
  const header =
    "username,profileUrl,displayName,profileImageUrl,publicEmail,status,error,extractedAt";

  const lines = rows.map((row) =>
    [
      escapeCsvValue(row.username),
      escapeCsvValue(row.profileUrl),
      escapeCsvValue(row.displayName),
      escapeCsvValue(row.profileImageUrl),
      escapeCsvValue(row.publicEmail),
      escapeCsvValue(row.status),
      escapeCsvValue(row.error),
      escapeCsvValue(row.extractedAt),
    ].join(","),
  );

  return [header, ...lines].join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
