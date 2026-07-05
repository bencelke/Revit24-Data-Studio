"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateCsvTemplate } from "@/lib/services/csvParserService";

export function CsvTemplateDownload() {
  function handleDownload() {
    const content = generateCsvTemplate();
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "revit24-csv-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">CSV Template</CardTitle>
        <CardDescription>Recommended schema for automotive records</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="secondary" size="sm" onClick={handleDownload}>
          <Download className="mr-2 size-4" />
          Download Revit24 CSV Template
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Includes: name, type, location, social links, contact info, tags, and source_url.
        </p>
      </CardContent>
    </Card>
  );
}
