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
  { label: "Proyectos", href: "/proyectos", icon: FolderKanban },
  { label: "Archivos", href: "/archivos", icon: FileText },
  { label: "Asistente", href: "/asistente", icon: Sparkles },
  { label: "Habitos", href: "/habitos", icon: CheckCircle2 },
  { label: "Objetivos", href: "/objetivos", icon: Target },
  { label: "Entrenamiento", href: "/entrenamiento", icon: Dumbbell },
  { label: "Gastos", href: "/gastos", icon: Wallet },
  { label: "Configuracion", href: "/configuracion", icon: Settings },
];

/** Subset shown in the mobile bottom nav; the rest live behind "Mas". */
export const mobilePrimaryNavItems: NavItem[] = [
  navItems[0]!,
  navItems[1]!,
  navItems[2]!,
  navItems[5]!,
];
