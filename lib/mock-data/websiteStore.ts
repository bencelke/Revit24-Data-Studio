import type {
  CreateWebsiteJobInput,
  CreateWebsiteRawInput,
  WebsiteJobDocument,
  WebsiteRawDocument,
} from "@/lib/types/websites";

const mockJobs = new Map<string, WebsiteJobDocument>();
const mockRaw = new Map<string, WebsiteRawDocument>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockWebsiteStore = {
  createJob(input: CreateWebsiteJobInput): WebsiteJobDocument {
    const id = generateId("web_job");
    const job: WebsiteJobDocument = { ...input, id };
    mockJobs.set(id, job);
    return job;
  },

  getJob(id: string): WebsiteJobDocument | null {
    return mockJobs.get(id) ?? null;
  },

  listJobs(): WebsiteJobDocument[] {
    return [...mockJobs.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  updateJob(id: string, data: Partial<WebsiteJobDocument>): WebsiteJobDocument | null {
    const existing = mockJobs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    mockJobs.set(id, updated);
    return updated;
  },

  upsertRaw(input: CreateWebsiteRawInput): WebsiteRawDocument {
    const existing = [...mockRaw.values()].find(
      (site) => site.url === input.url || site.domain === input.domain,
    );
    if (existing) {
      const updated = { ...input, id: existing.id };
      mockRaw.set(existing.id, updated);
      return updated;
    }
    const id = generateId("web_raw");
    const site: WebsiteRawDocument = { ...input, id };
    mockRaw.set(id, site);
    return site;
  },

  getRaw(id: string): WebsiteRawDocument | null {
    return mockRaw.get(id) ?? null;
  },

  listRaw(): WebsiteRawDocument[] {
    return [...mockRaw.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  listRawByJobId(jobId: string): WebsiteRawDocument[] {
    return this.listRaw().filter((site) => site.jobId === jobId);
  },

  updateRaw(id: string, data: Partial<CreateWebsiteRawInput>): WebsiteRawDocument | null {
    const existing = mockRaw.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    mockRaw.set(id, updated);
    return updated;
  },
};
