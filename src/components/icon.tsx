import {
  Book,
  BookText,
  Box,
  File,
  FileArchive,
  FileCode2,
  FileText,
  Gauge,
  GitBranch,
  Github,
  GraduationCap,
  Image,
  Layers,
  LayoutTemplate,
  Linkedin,
  ListChecks,
  Mail,
  MessageCircleQuestion,
  MessagesSquare,
  Network,
  Presentation,
  ScanSearch,
  School,
  Sparkles,
  TrendingUp,
  Trophy,
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
  Gauge,
  GitBranch,
  Github,
  GraduationCap,
  Image,
  Layers,
  LayoutTemplate,
  Linkedin,
  ListChecks,
  Mail,
  MessageCircleQuestion,
  MessagesSquare,
  Network,
  Presentation,
  ScanSearch,
  School,
  Sparkles,
  TrendingUp,
  Trophy,
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
