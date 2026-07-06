import type {
  CreateDiscoveryCampaignInput,
  CreateDiscoveryJobInput,
  CreateDiscoveryResultInput,
  CreateDiscoveryTemplateInput,
  DiscoveryCampaignDocument,
  DiscoveryJobDocument,
  DiscoveryResultDocument,
  DiscoveryTemplateDocument,
} from "@/lib/types/discovery-engine";

const campaigns = new Map<string, DiscoveryCampaignDocument>();
const jobs = new Map<string, DiscoveryJobDocument>();
const results = new Map<string, DiscoveryResultDocument>();
const templates = new Map<string, DiscoveryTemplateDocument>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockDiscoveryStore = {
  createCampaign(input: CreateDiscoveryCampaignInput): DiscoveryCampaignDocument {
    const id = generateId("disc_camp");
    const campaign = { ...input, id };
    campaigns.set(id, campaign);
    return campaign;
  },

  getCampaign(id: string): DiscoveryCampaignDocument | null {
    return campaigns.get(id) ?? null;
  },

  listCampaigns(): DiscoveryCampaignDocument[] {
    return [...campaigns.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  updateCampaign(id: string, data: Partial<CreateDiscoveryCampaignInput>): DiscoveryCampaignDocument | null {
    const existing = campaigns.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    campaigns.set(id, updated);
    return updated;
  },

  createJob(input: CreateDiscoveryJobInput): DiscoveryJobDocument {
    const id = generateId("disc_job");
    const job = { ...input, id };
    jobs.set(id, job);
    return job;
  },

  getJob(id: string): DiscoveryJobDocument | null {
    return jobs.get(id) ?? null;
  },

  listJobs(): DiscoveryJobDocument[] {
    return [...jobs.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  listJobsByCampaignId(campaignId: string): DiscoveryJobDocument[] {
    return [...jobs.values()]
      .filter((job) => job.campaignId === campaignId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  updateJob(id: string, data: Partial<CreateDiscoveryJobInput>): DiscoveryJobDocument | null {
    const existing = jobs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    jobs.set(id, updated);
    return updated;
  },

  createResults(inputs: CreateDiscoveryResultInput[]): DiscoveryResultDocument[] {
    return inputs.map((input) => {
      const id = generateId("disc_res");
      const result = { ...input, id };
      results.set(id, result);
      return result;
    });
  },

  listResults(): DiscoveryResultDocument[] {
    return [...results.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  listResultsByJobId(jobId: string): DiscoveryResultDocument[] {
    return [...results.values()]
      .filter((result) => result.jobId === jobId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  listResultsByCampaignId(campaignId: string): DiscoveryResultDocument[] {
    return [...results.values()]
      .filter((result) => result.campaignId === campaignId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createTemplate(input: CreateDiscoveryTemplateInput): DiscoveryTemplateDocument {
    const id = generateId("disc_tpl");
    const template = { ...input, id };
    templates.set(id, template);
    return template;
  },

  listTemplates(): DiscoveryTemplateDocument[] {
    return [...templates.values()].sort((a, b) => a.name.localeCompare(b.name));
  },

  getTemplate(id: string): DiscoveryTemplateDocument | null {
    return templates.get(id) ?? null;
  },

  hasData(): boolean {
    return campaigns.size > 0;
  },
};
