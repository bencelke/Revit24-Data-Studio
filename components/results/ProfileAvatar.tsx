"use client";

import { useState } from "react";
import Image from "next/image";
import { useIsClientReady } from "@/hooks/useIsClientReady";

interface ProfileAvatarProps {
  username: string;
  profileImageUrl: string | null;
}

export function ProfileAvatar({ username, profileImageUrl }: ProfileAvatarProps) {
  const isClientReady = useIsClientReady();
  const [hasError, setHasError] = useState(false);
  const initials = username.slice(0, 2).toUpperCase();

  if (!isClientReady || !profileImageUrl || hasError) {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={profileImageUrl}
      alt={username}
      width={32}
      height={32}
      className="size-8 shrink-0 rounded-full object-cover"
      unoptimized
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
}
