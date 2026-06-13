import {
  Book,
  BookText,
  Box,
  File,
  FileArchive,
  FileCode2,
  FileText,
  Github,
  GraduationCap,
  Image,
  LayoutTemplate,
  Linkedin,
  ListChecks,
  Mail,
  MessagesSquare,
  Network,
  Presentation,
  Sparkles,
  Video,
  type LucideIcon,
} from "lucide-react";

/**
 * Resolve a lucide icon by name (the names stored in constants.ts).
 * Falls back to a neutral icon so the UI never crashes on an unknown key.
 */
const ICONS: Record<string, LucideIcon> = {
  Book,
  BookText,
  Box,
  File,
  FileArchive,
  FileCode2,
  FileText,
  Github,
  GraduationCap,
  Image,
  LayoutTemplate,
  Linkedin,
  ListChecks,
  Mail,
  MessagesSquare,
  Network,
  Presentation,
  Sparkles,
  Video,
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = ICONS[name] ?? Sparkles;
  return <Cmp className={className} />;
}
