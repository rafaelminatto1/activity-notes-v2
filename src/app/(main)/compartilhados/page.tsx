"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { removeProjectMember, subscribeToMemberProjects } from "@/lib/firebase/projects";
import type { Project } from "@/types/project";
import { toast } from "sonner";

export default function CompartilhadosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToMemberProjects(user.uid, (items) => {
      setProjects(items.filter((project) => project.userId !== user.uid));
    });
    return () => unsubscribe();
  }, [user?.uid]);

  async function handleLeave(project: Project) {
    if (!user?.uid) return;
    if (!confirm(`Sair do compartilhamento de "${project.name}"?`)) return;

    try {
      await removeProjectMember(project.id, user.uid);
      toast.success("Você saiu do compartilhamento.");
    } catch {
      toast.error("Falha ao sair do compartilhamento.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Compartilhados comigo</h1>
        <p className="text-sm text-muted-foreground">
          Projetos em que você participa como membro.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center text-muted-foreground">
          Nenhum projeto compartilhado com você.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <span>{project.icon || "🤝"}</span>
                  <span className="truncate">{project.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>Dono: {project.userId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => router.push(`/documents?project=${project.id}`)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-destructive"
                    onClick={() => handleLeave(project)}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sair
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
