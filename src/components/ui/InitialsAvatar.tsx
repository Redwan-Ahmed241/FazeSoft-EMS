import { useState, useEffect } from "react";
import { getInitials, getAvatarColor } from "../../utils/getInitials";

interface InitialsAvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function InitialsAvatar({
  name,
  src,
  size = "md",
  className = "",
}: InitialsAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setImageError(false);
  }, [src]);

  const initials = getInitials(name);
  const colors = getAvatarColor(name);

  // Determine size classes
  let sizeClass = "h-10 w-10 text-sm font-semibold";
  if (size === "sm") {
    sizeClass = "h-8 w-8 text-xs font-semibold";
  } else if (size === "lg") {
    sizeClass = "h-16 w-16 text-xl font-bold";
  }

  // If there's an image and it hasn't errored, try rendering it
  // But also filter out common placeholder/dummy URLs or empty/null strings
  const isValidSrc =
    src &&
    src.trim() !== "" &&
    !src.includes("pravatar.cc") &&
    !src.includes("ui-avatars.com");

  if (isValidSrc && !imageError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImageError(true)}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700 ${className}`}
      />
    );
  }

  // Otherwise, render the initials fallback with deterministic colors
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 select-none ${className}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {initials}
    </div>
  );
}
