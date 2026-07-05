import type {
  CreateInstagramProfileInput,
  InstagramProfileDocument,
} from "@/lib/types/instagram-profiles";

const mockProfiles = new Map<string, InstagramProfileDocument>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function profileKey(username: string): string {
  return username.toLowerCase();
}

export const mockInstagramProfileStore = {
  upsertInstagramProfile(input: CreateInstagramProfileInput): InstagramProfileDocument {
    const key = profileKey(input.username);
    const existing = [...mockProfiles.values()].find(
      (profile) => profileKey(profile.username) === key,
    );

    if (existing) {
      const updated: InstagramProfileDocument = { ...input, id: existing.id };
      mockProfiles.set(existing.id, updated);
      return updated;
    }

    const id = generateId("ig_profile");
    const profile: InstagramProfileDocument = { ...input, id };
    mockProfiles.set(id, profile);
    return profile;
  },

  getInstagramProfileByUsername(username: string): InstagramProfileDocument | null {
    return (
      [...mockProfiles.values()].find(
        (profile) => profileKey(profile.username) === profileKey(username),
      ) ?? null
    );
  },

  listInstagramProfiles(): InstagramProfileDocument[] {
    return [...mockProfiles.values()].sort(
      (a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime(),
    );
  },
};
