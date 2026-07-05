import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { ImportCard, ImportPageNav } from "@/components/imports";
import { getImportTypeDefinitions } from "@/lib/services/importService";

export const metadata: Metadata = {
  title: "New Import",
};

export default function NewImportPage() {
  const importTypes = getImportTypeDefinitions();

  return (
    <AppShell
      title="New Import"
      description="Choose a source type to begin collecting automotive community data"
    >
      <div className="space-y-6">
        <ImportPageNav active="new" />

        <div>
          <h2 className="text-base font-semibold">Select Import Type</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each import type will connect to a dedicated pipeline in future
            phases.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {importTypes.map((definition) => (
            <ImportCard
              key={definition.type}
              definition={definition}
              href={
                definition.availability === "available"
                  ? definition.type === "instagram"
                    ? "/imports/new/instagram"
                    : definition.type === "google_places"
                      ? "/google-places/search"
                      : `/imports/new?type=${definition.type}`
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
