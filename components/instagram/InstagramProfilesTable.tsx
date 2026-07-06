"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InstagramProfileDocument } from "@/lib/types/instagram-profiles";

interface InstagramProfilesTableProps {
  profiles: InstagramProfileDocument[];
}

export function InstagramProfilesTable({ profiles }: InstagramProfilesTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return profiles;
    return profiles.filter(
      (profile) =>
        profile.username.toLowerCase().includes(query) ||
        (profile.displayName ?? "").toLowerCase().includes(query) ||
        (profile.bio ?? "").toLowerCase().includes(query),
    );
  }, [profiles, search]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search profiles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Followers</TableHead>
              <TableHead>Extracted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No profiles found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">@{profile.username}</TableCell>
                  <TableCell>{profile.displayName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {profile.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {profile.followers != null ? profile.followers.toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(profile.lastExtractedAt ?? profile.extractedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/instagram/profiles/${profile.username}`} />}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
