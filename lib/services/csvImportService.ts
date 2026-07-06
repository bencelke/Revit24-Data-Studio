import { mockCsvImportStore } from "@/lib/mock-data/csvImportStore";
import { FirestoreNotConfiguredError, MOCK_MODE_WARNING } from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  createCsvImportJob as persistCsvJob,
  getCsvImportJob as fetchCsvJob,
  listCsvImportJobs as fetchCsvJobs,
  updateCsvImportJob as persistUpdateCsvJob,
} from "@/lib/repositories/csvImportJobsRepository";
import {
  createCsvImportRecords as persistCsvRecords,
  listCsvImportRecordsByJobId as fetchCsvRecordsByJobId,
  updateCsvImportRecord as persistUpdateCsvRecord,
} from "@/lib/repositories/csvImportRecordsRepository";
import {
  createImportJob as persistImportJob,
} from "@/lib/repositories/importJobsRepository";
import { createImportRecords as persistImportRecords } from "@/lib/repositories/importRecordsRepository";
import { listNormalizedRecords as fetchNormalizedRecords } from "@/lib/repositories/normalizedRecordsRepository";
import { listApprovedRecords as fetchApprovedRecords } from "@/lib/repositories/approvedRecordsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import { mockImportJobStore } from "@/lib/mock-data/importJobStore";
import { mockNormalizationStore } from "@/lib/mock-data/normalizationStore";
import { parseCsvContent, validateCsvFileSize, validateCsvRowCount } from "@/lib/services/csvParserService";
import { applyFieldMapping, autoDetectFieldMapping, isMappingComplete } from "@/lib/services/csvMappingService";
import { compareCsvRowToRecord, validateCsvRow, extractInstagramUsername } from "@/lib/services/csvValidationService";
import { normalizeCsvRow } from "@/lib/services/csvNormalizationService";
import { createDefaultReviewFields } from "@/lib/types/review";
import type {
  CreateCsvImportJobInput,
  CreateCsvImportRecordInput,
  CsvFieldMapping,
  CsvImportHistoryData,
  CsvImportJobDetailData,
  CsvImportJobDocument,
  CsvImportPageData,
  CsvImportPreviewRow,
  CsvImportRecordDocument,
  CsvImportResult,
  CsvParseResult,
  CsvValidationSummary,
} from "@/lib/types/csv-import";
import type { NormalizedRecordDocument } from "@/lib/types/normalization";
import type { ApprovedRecordDocument } from "@/lib/types/review";

const CREATED_BY = "system-dev";
const CSV_JOB_TYPE = "csv_bulk_import";
const CSV_SOURCE = "csv";

async function saveJob(input: CreateCsvImportJobInput): Promise<CsvImportJobDocument> {
  if (isFirestoreAvailable()) {
    try {
      return await persistCsvJob(input);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockCsvImportStore.createJob(input);
      throw error;
    }
  }
  return mockCsvImportStore.createJob(input);
}

async function updateJob(id: string, data: Partial<CreateCsvImportJobInput>): Promise<CsvImportJobDocument | null> {
  if (isFirestoreAvailable()) {
    try {
      await persistUpdateCsvJob(id, data);
      return await getCsvImportJob(id);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockCsvImportStore.updateJob(id, data);
      throw error;
    }
  }
  return mockCsvImportStore.updateJob(id, data);
}

async function getCsvImportJob(id: string): Promise<CsvImportJobDocument | null> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchCsvJob(id);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockCsvImportStore.getJob(id);
      throw error;
    }
  }
  return mockCsvImportStore.getJob(id);
}

async function saveRecords(records: CreateCsvImportRecordInput[]): Promise<CsvImportRecordDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await persistCsvRecords(records);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockCsvImportStore.createRecords(records);
      throw error;
    }
  }
  return mockCsvImportStore.createRecords(records);
}

async function loadRecords(jobId: string): Promise<CsvImportRecordDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchCsvRecordsByJobId(jobId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockCsvImportStore.listRecordsByJobId(jobId);
      throw error;
    }
  }
  return mockCsvImportStore.listRecordsByJobId(jobId);
}

async function loadNormalizedRecords(): Promise<NormalizedRecordDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchNormalizedRecords();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockNormalizationStore.listRecords();
      throw error;
    }
  }
  return mockNormalizationStore.listRecords();
}

async function loadApprovedRecords(): Promise<ApprovedRecordDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchApprovedRecords();
    } catch {
      return [];
    }
  }
  return [];
}

function computeSummary(records: CsvImportRecordDocument[]): CsvValidationSummary {
  return {
    totalRows: records.length,
    validRows: records.filter((r) => r.validationStatus === "valid" || r.validationStatus === "warning").length,
    invalidRows: records.filter((r) => r.validationStatus === "invalid").length,
    duplicateRows: records.filter((r) => r.validationStatus === "duplicate").length,
    warningRows: records.filter((r) => r.validationStatus === "warning").length,
  };
}

export function getCsvImportPageData(): CsvImportPageData {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  return {
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
    warning: useFirestore ? undefined : MOCK_MODE_WARNING,
  };
}

export async function getCsvImportHistoryData(): Promise<CsvImportHistoryData> {
  const pageData = getCsvImportPageData();
  let jobs: CsvImportJobDocument[];

  if (isFirestoreAvailable()) {
    try {
      jobs = await fetchCsvJobs();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) jobs = mockCsvImportStore.listJobs();
      else throw error;
    }
  } else {
    jobs = mockCsvImportStore.listJobs();
  }

  return { ...pageData, jobs };
}

export async function getCsvImportJobDetail(jobId: string): Promise<CsvImportJobDetailData | null> {
  const pageData = getCsvImportPageData();
  const job = await getCsvImportJob(jobId);
  if (!job) return null;

  const records = await loadRecords(jobId);
  return { ...pageData, job, records, summary: computeSummary(records) };
}

export function parseAndDetectCsv(content: string, fileName: string, fileSize: number): {
  parseResult: CsvParseResult;
  mapping: CsvFieldMapping;
  fileError: string | null;
} {
  const fileError = validateCsvFileSize(fileSize);
  const parseResult = parseCsvContent(content);
  const rowError = validateCsvRowCount(parseResult.totalRows);
  const mapping = autoDetectFieldMapping(parseResult.headers);

  return {
    parseResult,
    mapping,
    fileError: fileError ?? rowError,
  };
}

export function buildPreviewRows(
  parseResult: CsvParseResult,
  mapping: CsvFieldMapping,
  existingRecords: Array<{
    id: string;
    displayName: string;
    username: string | null;
    website: string | null;
    publicEmail: string | null;
    publicPhone: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
  }>,
): CsvImportPreviewRow[] {
  return parseResult.rows.map((row, index) => {
    const mappedData = applyFieldMapping(row, mapping);
    const validation = validateCsvRow(mappedData);

    const duplicateMatches = existingRecords
      .map((record) => compareCsvRowToRecord(mappedData, record))
      .filter((match): match is NonNullable<typeof match> => match !== null)
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, 3);

    let validationStatus = validation.validationStatus;
    if (duplicateMatches.some((m) => m.confidenceScore >= 70)) {
      validationStatus = "duplicate";
    }

    return {
      rowNumber: index + 2,
      mappedData,
      validationStatus,
      errors: validation.errors,
      warnings: validation.warnings,
      duplicateMatches,
    };
  });
}

export async function validateCsvImportPreview(
  content: string,
  mapping: CsvFieldMapping,
): Promise<{ preview: CsvImportPreviewRow[]; summary: CsvValidationSummary }> {
  const parseResult = parseCsvContent(content);
  const [existing, approved] = await Promise.all([loadNormalizedRecords(), loadApprovedRecords()]);
  const approvedAsRecords = approved.map((a) => ({
    id: a.id,
    displayName: a.displayName ?? a.username ?? "Unknown",
    username: a.username,
    website: a.website,
    publicEmail: a.publicEmail,
    publicPhone: null as string | null,
    city: a.city,
    latitude: null as number | null,
    longitude: null as number | null,
  }));
  const preview = buildPreviewRows(parseResult, mapping, [...existing, ...approvedAsRecords]);

  return {
    preview,
    summary: {
      totalRows: preview.length,
      validRows: preview.filter((r) => r.validationStatus === "valid" || r.validationStatus === "warning").length,
      invalidRows: preview.filter((r) => r.validationStatus === "invalid").length,
      duplicateRows: preview.filter((r) => r.validationStatus === "duplicate").length,
      warningRows: preview.filter((r) => r.validationStatus === "warning").length,
    },
  };
}

export async function createCsvImportJobFromUpload(input: {
  content: string;
  fileName: string;
  fileSize: number;
  mapping: CsvFieldMapping;
  notes?: string;
}): Promise<CsvImportResult> {
  if (!isMappingComplete(input.mapping)) {
    throw new Error("Column mapping incomplete — map at least name or source_url.");
  }

  const fileError = validateCsvFileSize(input.fileSize) ?? validateCsvRowCount(parseCsvContent(input.content).totalRows);
  if (fileError) throw new Error(fileError);

  const timestamp = new Date().toISOString();
  const parseResult = parseCsvContent(input.content);
  const [existing, approved] = await Promise.all([loadNormalizedRecords(), loadApprovedRecords()]);
  const approvedAsRecords = approved.map((a) => ({
    id: a.id,
    displayName: a.displayName ?? a.username ?? "Unknown",
    username: a.username,
    website: a.website,
    publicEmail: a.publicEmail,
    publicPhone: null as string | null,
    city: a.city,
    latitude: null as number | null,
    longitude: null as number | null,
  }));
  const preview = buildPreviewRows(parseResult, input.mapping, [...existing, ...approvedAsRecords]);
  const summary = computeSummaryFromPreview(preview);

  const job = await saveJob({
    fileName: input.fileName,
    fileSize: input.fileSize,
    uploadedBy: CREATED_BY,
    uploadedAt: timestamp,
    status: "importing",
    totalRows: preview.length,
    validRows: summary.validRows,
    invalidRows: summary.invalidRows,
    duplicateRows: summary.duplicateRows,
    mappedFields: input.mapping,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
    notes: input.notes ?? null,
    importJobId: null,
  });

  const recordInputs: CreateCsvImportRecordInput[] = preview.map((row, index) => ({
    jobId: job.id,
    rowNumber: row.rowNumber,
    rawData: parseResult.rows[index],
    mappedData: row.mappedData,
    validationStatus: row.validationStatus,
    errors: row.errors,
    warnings: row.warnings,
    duplicateMatches: row.duplicateMatches,
    normalizedRecordId: null,
    reviewRecordId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  const records = await saveRecords(recordInputs);

  let normalizedCount = 0;
  let reviewCount = 0;
  let importJobId: string | null = null;

  const validRecords = records.filter(
    (r) => r.validationStatus === "valid" || r.validationStatus === "warning" || r.validationStatus === "duplicate",
  );

  if (validRecords.length > 0) {
    const importJobInput = {
      name: `CSV Import — ${input.fileName}`,
      type: CSV_JOB_TYPE,
      source: CSV_SOURCE,
      status: "pending_review" as const,
      createdBy: CREATED_BY,
      createdAt: timestamp,
      updatedAt: timestamp,
      totalRecords: validRecords.length,
      validRecords: validRecords.length,
      duplicateRecords: records.filter((r) => r.validationStatus === "duplicate").length,
      invalidRecords: records.filter((r) => r.validationStatus === "invalid").length,
      notes: input.notes ?? `CSV import from ${input.fileName}`,
      metadata: { csvJobId: job.id, fileName: input.fileName },
    };

    if (isFirestoreAvailable()) {
      try {
        const importJob = await persistImportJob(importJobInput);
        importJobId = importJob.id;
        const reviewRecords = await persistImportRecords(
          validRecords.map((record) => ({
            jobId: importJob.id,
            originalInput: record.mappedData.source_url ?? record.mappedData.name ?? "",
            username: record.mappedData.instagram
              ? extractInstagramUsername(record.mappedData.instagram)
              : null,
            profileUrl: record.mappedData.source_url ?? record.mappedData.website,
            status: record.validationStatus === "duplicate" ? "duplicate" as const : "valid" as const,
            error: record.errors[0] ?? null,
            duplicateOf: null,
            createdAt: timestamp,
            updatedAt: timestamp,
            ...createDefaultReviewFields(
              record.validationStatus === "duplicate" ? "duplicate" : "valid",
              CSV_SOURCE,
            ),
            displayName: record.mappedData.name,
            website: record.mappedData.website,
            publicEmail: record.mappedData.email,
            description: record.mappedData.description,
            country: record.mappedData.country,
            city: record.mappedData.city,
            tags: record.mappedData.tags,
          })),
        );
        reviewCount = reviewRecords.length;

        for (let i = 0; i < validRecords.length; i += 1) {
          const csvRecord = validRecords[i];
          const reviewRecord = reviewRecords[i];
          if (csvRecord.validationStatus !== "invalid") {
            try {
              const normResult = await normalizeCsvRow(csvRecord.mappedData, csvRecord.id);
              normalizedCount += 1;
              if (isFirestoreAvailable()) {
                await persistUpdateCsvRecord(csvRecord.id, {
                  normalizedRecordId: normResult.record.id,
                  reviewRecordId: reviewRecord?.id ?? null,
                });
              } else {
                mockCsvImportStore.updateRecord(csvRecord.id, {
                  normalizedRecordId: normResult.record.id,
                  reviewRecordId: reviewRecord?.id ?? null,
                });
              }
            } catch {
              // Continue with remaining rows
            }
          }
        }
      } catch (error) {
        if (error instanceof FirestoreNotConfiguredError) {
          importJobId = await createMockReviewJob(validRecords, timestamp, input.fileName, job.id);
          reviewCount = validRecords.length;
          normalizedCount = await normalizeValidRecords(validRecords);
        } else {
          throw error;
        }
      }
    } else {
      importJobId = await createMockReviewJob(validRecords, timestamp, input.fileName, job.id);
      reviewCount = validRecords.length;
      normalizedCount = await normalizeValidRecords(validRecords);
    }
  }

  const completedAt = new Date().toISOString();
  const updatedJob = await updateJob(job.id, {
    status: "completed",
    completedAt,
    updatedAt: completedAt,
    importJobId,
    validRows: summary.validRows,
    invalidRows: summary.invalidRows,
    duplicateRows: summary.duplicateRows,
  });

  if (importJobId) {
    const { startPipelineForImport } = await import("@/lib/services/pipelineIntegrationService");
    await startPipelineForImport({
      provider: "csv",
      importJobId,
      totalRecords: validRecords.length,
      skipExtraction: true,
      metadata: { csvJobId: job.id, fileName: input.fileName },
    });
  }

  return {
    job: updatedJob ?? job,
    records,
    importJobId,
    normalizedCount,
    reviewCount,
  };
}

function computeSummaryFromPreview(preview: CsvImportPreviewRow[]): CsvValidationSummary {
  return {
    totalRows: preview.length,
    validRows: preview.filter((r) => r.validationStatus === "valid" || r.validationStatus === "warning").length,
    invalidRows: preview.filter((r) => r.validationStatus === "invalid").length,
    duplicateRows: preview.filter((r) => r.validationStatus === "duplicate").length,
    warningRows: preview.filter((r) => r.validationStatus === "warning").length,
  };
}

async function createMockReviewJob(
  validRecords: CsvImportRecordDocument[],
  timestamp: string,
  fileName: string,
  csvJobId: string,
): Promise<string> {
  const job = mockImportJobStore.createImportJob({
    name: `CSV Import — ${fileName}`,
    type: CSV_JOB_TYPE,
    source: CSV_SOURCE,
    status: "pending_review",
    createdBy: CREATED_BY,
    createdAt: timestamp,
    updatedAt: timestamp,
    totalRecords: validRecords.length,
    validRecords: validRecords.length,
    duplicateRecords: validRecords.filter((r) => r.validationStatus === "duplicate").length,
    invalidRecords: 0,
    notes: `CSV import from ${fileName}`,
    metadata: { csvJobId, fileName },
  });

  mockImportJobStore.createImportRecords(
    validRecords.map((record) => ({
      jobId: job.id,
      originalInput: record.mappedData.source_url ?? record.mappedData.name ?? "",
      username: record.mappedData.instagram ? extractInstagramUsername(record.mappedData.instagram) : null,
      profileUrl: record.mappedData.source_url ?? record.mappedData.website,
      status: record.validationStatus === "duplicate" ? "duplicate" as const : "valid" as const,
      error: record.errors[0] ?? null,
      duplicateOf: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...createDefaultReviewFields(record.validationStatus === "duplicate" ? "duplicate" : "valid", CSV_SOURCE),
      displayName: record.mappedData.name,
      website: record.mappedData.website,
      publicEmail: record.mappedData.email,
      description: record.mappedData.description,
      country: record.mappedData.country,
      city: record.mappedData.city,
      tags: record.mappedData.tags,
    })),
  );

  return job.id;
}

async function normalizeValidRecords(records: CsvImportRecordDocument[]): Promise<number> {
  let count = 0;
  for (const record of records) {
    if (record.validationStatus === "invalid") continue;
    try {
      const result = await normalizeCsvRow(record.mappedData, record.id);
      mockCsvImportStore.updateRecord(record.id, { normalizedRecordId: result.record.id });
      count += 1;
    } catch {
      // continue
    }
  }
  return count;
}
