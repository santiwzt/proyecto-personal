import {
  Home,
  Calendar,
  BookOpen,
  FolderKanban,
  FileText,
  Sparkles,
  CheckCircle2,
  Target,
  Dumbbell,
  Wallet,
  Lightbulb,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Hoy", href: "/hoy", icon: Home },
  { label: "Agenda", href: "/agenda", icon: Calendar },
  { label: "Estudios", href: "/estudios", icon: BookOpen },
  { label: "Metodos", href: "/metodos", icon: Lightbulb },
  { label: "Proyectos", href: "/proyectos", icon: FolderKanban },
  { label: "Archivos", href: "/archivos", icon: FileText },
  { label: "Asistente", href: "/asistente", icon: Sparkles },
  { label: "Habitos", href: "/habitos", icon: CheckCircle2 },
  { label: "Objetivos", href: "/objetivos", icon: Target },
  { label: "Entrenamiento", href: "/entrenamiento", icon: Dumbbell },
  { label: "Gastos", href: "/gastos", icon: Wallet },
  { label: "Configuracion", href: "/configuracion", icon: Settings },
];

/** Subset shown in the mobile bottom nav; the rest live behind "Mas". Looked
 * up by href (not array position) so reordering/inserting navItems above
 * can't silently swap which ones show up here. */
const MOBILE_PRIMARY_HREFS = ["/hoy", "/agenda", "/estudios", "/asistente"];
export const mobilePrimaryNavItems: NavItem[] = MOBILE_PRIMARY_HREFS.map(
  (href) => navItems.find((item) => item.href === href)!,
);
