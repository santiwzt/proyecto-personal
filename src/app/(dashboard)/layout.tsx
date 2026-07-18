import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { subjectsRepository } from "@/server/repositories/academic-repository";
import { projectsRepository } from "@/server/repositories/projects-repository";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [subjects, projects] = await Promise.all([
    subjectsRepository.list(user.userId),
    projectsRepository.list(user.userId),
  ]);

  return (
    <DashboardShell user={user} subjects={subjects} projects={projects}>
      {children}
    </DashboardShell>
  );
}
