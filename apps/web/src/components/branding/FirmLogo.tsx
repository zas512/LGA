"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { PlaceholderLogo } from "./PlaceholderLogo";

interface FirmLogoProps {
  logoUrl?: string | null;
  name: string;
  accentColor?: string | null;
  /** Side length in px. */
  size?: number;
  rounded?: string;
  className?: string;
}

/**
 * A firm's logo, with the initials placeholder as fallback. Falls back both
 * when no logoUrl is set and when the image fails to load (broken CDN link).
 */
export function FirmLogo({
  logoUrl,
  name,
  accentColor,
  size = 36,
  rounded = "rounded-xl",
  className
}: Readonly<FirmLogoProps>) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(logoUrl) && !failed;

  if (!showImage) {
    return (
      <PlaceholderLogo
        name={name}
        accentColor={accentColor}
        size={size}
        rounded={rounded}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn("relative shrink-0 overflow-hidden", rounded, className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={logoUrl!}
        alt={`${name} logo`}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
