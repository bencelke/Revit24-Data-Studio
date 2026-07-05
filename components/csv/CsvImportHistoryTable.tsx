"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CsvImportJobDocument } from "@/lib/types/csv-import";
import { formatImportDate } from "@/lib/services/importService";

interface CsvImportHistoryTableProps {
  jobs: CsvImportJobDocument[];
}

export function CsvImportHistoryTable({ jobs }: CsvImportHistoryTableProps) {
  return (
    <div className="rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="p-3">File</th>
            <th className="p-3">Status</th>
            <th className="p-3">Rows</th>
            <th className="p-3">Valid</th>
            <th className="p-3">Duplicates</th>
            <th className="p-3">Uploaded</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-6 text-center text-muted-foreground">
                No CSV import jobs yet.
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{job.fileName}</td>
                <td className="p-3 capitalize">{job.status}</td>
                <td className="p-3">{job.totalRows}</td>
                <td className="p-3">{job.validRows}</td>
                <td className="p-3">{job.duplicateRows}</td>
                <td className="p-3">{formatImportDate(job.uploadedAt)}</td>
                <td className="p-3">
                  <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/imports/csv/${job.id}`} />}>
                    View
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
