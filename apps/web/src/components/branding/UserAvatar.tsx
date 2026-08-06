"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  email?: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * User avatar: Google profile picture when available, initials otherwise. The
 * base-ui Avatar shows the fallback until the image loads, and on error.
 */
export function UserAvatar({
  avatarUrl,
  name,
  email,
  size = "default",
  className
}: Readonly<UserAvatarProps>) {
  const label = name?.trim() || email || "User";
  return (
    <Avatar size={size} className={cn("shrink-0", className)}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={label} />
      ) : null}
      <AvatarFallback>{initialsOf(label)}</AvatarFallback>
    </Avatar>
  );
}
