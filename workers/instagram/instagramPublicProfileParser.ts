export {
  parseInstagramPublicProfilePage,
  buildMockInstagramPublicProfile,
} from "@/lib/providers/instagram";

export { extractEmailFromText as extractPublicEmailFromBio } from "@/lib/utils/instagramMetadata";

/** @deprecated Public phone extraction removed */
export function extractPublicPhoneFromBio(): string | null {
  return null;
}
