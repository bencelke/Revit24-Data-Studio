import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataModeBadge } from "@/components/imports/DataModeBadge";
import {
  InstagramProfileHeader,
  InstagramProfileStats,
  InstagramMetadataCard,
} from "@/components/profiles";
import { getInstagramProfile } from "@/lib/services/instagramExtractionService";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getInstagramProfile(username);

  return {
    title: profile
      ? `${profile.displayName ?? profile.username} — Extraction Review`
      : `Profile — ${username}`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profile = await getInstagramProfile(username);

  if (!profile) notFound();

  const firebaseConfigured = isFirebaseConfigured();
  const dataMode = isFirestoreAvailable() ? "firestore" : "mock";

  return (
    <AppShell
      title="Profile Extraction Review"
      description="Internal Revit24 view — not ShiftIt"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/queue" />}
            className="gap-1.5 px-0 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to queue
          </Button>
          <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
        </div>

        <div className="flex items-start gap-4">
          <Avatar className="size-20">
            {profile.profileImageUrl ? (
              <AvatarImage src={profile.profileImageUrl} alt={profile.username} />
            ) : null}
            <AvatarFallback className="bg-muted text-lg text-muted-foreground">
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <InstagramProfileHeader profile={profile} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <InstagramProfileStats profile={profile} />
          <InstagramMetadataCard profile={profile} />
        </div>
      </div>
    </AppShell>
  );
}
