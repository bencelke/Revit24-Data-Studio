"use client";

import { cn } from "@/lib/utils";
import type { CsvImportJobStatus } from "@/lib/types/csv-import";

const STEPS: Array<{ key: CsvImportJobStatus | "upload"; label: string }> = [
  { key: "upload", label: "Upload" },
  { key: "mapping", label: "Map Columns" },
  { key: "validating", label: "Validate" },
  { key: "ready", label: "Preview" },
  { key: "importing", label: "Import" },
  { key: "completed", label: "Complete" },
];

interface CsvImportStepperProps {
  currentStep: CsvImportJobStatus | "upload";
}

function stepIndex(step: CsvImportJobStatus | "upload"): number {
  return STEPS.findIndex((s) => s.key === step);
}

export function CsvImportStepper({ currentStep }: CsvImportStepperProps) {
  const current = stepIndex(currentStep);

  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((step, index) => {
        const isActive = index === current;
        const isComplete = index < current;
        return (
          <li
            key={step.key}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium",
              isActive && "bg-brand/10 text-brand",
              isComplete && "text-muted-foreground",
              !isActive && !isComplete && "text-muted-foreground/60",
            )}
          >
            {index + 1}. {step.label}
          </li>
        );
      })}
    </ol>
  );
}
