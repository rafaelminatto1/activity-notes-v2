"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpenText,
  Building2,
  Clock,
  FileText,
  FolderOpen,
  PlusCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  createDocument,
  getDocument,
  subscribeToProjectDocuments,
  subscribeToSpaceDocuments,
} from "@/lib/firebase/firestore";
import {
  subscribeToMemberProjects,
  subscribeToUserProjects,
} from "@/lib/firebase/projects";
import { subscribeToSpaces } from "@/lib/firebase/spaces";
import { toast } from "sonner";
import type { Document } from "@/types/document";
import type { Project, ProjectKind } from "@/types/project";
import type { Space } from "@/types/space";

export default function DocumentsPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  const spaceId = searchParams.get("space");

  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [projectDocs, setProjectDocs] = useState<Document[]>([]);
  const [spaceDocs, setSpaceDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [sharedProjects, setSharedProjects] = useState<Project[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubOwned = subscribeToUserProjects(user.uid, (projects) => {
      setOwnedProjects(projects);
    });
    const unsubShared = subscribeToMemberProjects(user.uid, (projects) => {
      setSharedProjects(projects.filter((project) => project.userId !== user.uid));
    });
    const unsubSpaces = subscribeToSpaces(user.uid, (items) => {
      setSpaces(items);
    });

    return () => {
      unsubOwned();
      unsubShared();
      unsubSpaces();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if (projectId) {
      const unsubscribe = subscribeToProjectDocuments(user.uid, projectId, (docs) => {
        setProjectDocs(docs);
        setLoading(false);
      });
      return () => unsubscribe();
    }

    if (spaceId) {
      const unsubscribe = subscribeToSpaceDocuments(user.uid, spaceId, (docs) => {
        setSpaceDocs(docs);
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    }

    async function loadRecents() {
      const ids = userProfile?.recentDocIds ?? [];
      if (ids.length === 0) {
        setRecentDocs([]);
        setLoading(false);
        return;
      }
      const docs = await Promise.all(ids.slice(0, 10).map((id) => getDocument(id)));
      setRecentDocs(docs.filter((d): d is Document => d !== null && !d.isArchived));
      setLoading(false);
    }

    loadRecents();
  }, [user, userProfile?.recentDocIds, projectId, spaceId]);

  const folderProjects = useMemo(
    () => ownedProjects.filter((project) => resolveProjectKind(project) !== "notebook"),
    [ownedProjects]
  );
  const notebookProjects = useMemo(
    () => ownedProjects.filter((project) => resolveProjectKind(project) === "notebook"),
    [ownedProjects]
  );
  const allProjects = useMemo(() => {
    const map = new Map<string, Project>();
    [...ownedProjects, ...sharedProjects].forEach((project) => {
      map.set(project.id, project);
    });
    return Array.from(map.values());
  }, [ownedProjects, sharedProjects]);
  const currentProject = useMemo(
    () => (projectId ? allProjects.find((project) => project.id === projectId) ?? null : null),
    [allProjects, projectId]
  );
  const currentSpace = useMemo(
    () => (spaceId ? spaces.find((space) => space.id === spaceId) ?? null : null),
    [spaceId, spaces]
  );

  async function handleCreateDocument() {
    if (!user) return;
    try {
      const docId = await createDocument(user.uid, {
        projectId: projectId || null,
        spaceId: spaceId || null,
      });
      router.push(`/documents/${docId}`);
    } catch {
      toast.error("Falha ao criar documento.");
    }
  }

  const displayName = userProfile?.displayName || user?.displayName || "";
  const firstName = displayName.split(" ")[0] || "";
  const greeting = getGreeting();

  if (projectId && currentProject) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/documents")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md text-xl"
              style={{ backgroundColor: currentProject.color }}
            >
              {currentProject.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{currentProject.name}</h1>
              <p className="text-sm text-muted-foreground">{projectDocs.length} documentos</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={handleCreateDocument}
            className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-accent transition-colors"
          >
            <PlusCircle className="h-8 w-8 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Novo Documento</span>
          </button>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))
          ) : (
            projectDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => router.push(`/documents/${doc.id}`)}
                className="flex h-32 flex-col justify-between rounded-lg border p-4 text-left hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{doc.icon || "📄"}</span>
                  {doc.isPublished && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Publicado
                    </span>
                  )}
                </div>
                <span className="font-medium line-clamp-2">{doc.title || "Sem título"}</span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  if (spaceId && currentSpace) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/documents")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md text-xl"
              style={{ backgroundColor: currentSpace.color }}
            >
              {currentSpace.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{currentSpace.name}</h1>
              <p className="text-sm text-muted-foreground">{spaceDocs.length} documentos</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={handleCreateDocument}
            className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-accent transition-colors"
          >
            <PlusCircle className="h-8 w-8 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Novo Documento</span>
          </button>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))
          ) : (
            spaceDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => router.push(`/documents/${doc.id}`)}
                className="flex h-32 flex-col justify-between rounded-lg border p-4 text-left hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{doc.icon || "📄"}</span>
                  {doc.isPublished && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Publicado
                    </span>
                  )}
                </div>
                <span className="font-medium line-clamp-2">{doc.title || "Sem título"}</span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">
          {greeting}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">Seu espaço pessoal de trabalho.</p>
      </div>

      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          icon={<FolderOpen className="h-5 w-5" />}
          title="Pasta"
          description="Gerenciar pastas"
          onClick={() => router.push("/pastas")}
        />
        <ActionCard
          icon={<BookOpenText className="h-5 w-5" />}
          title="Caderno"
          description="Gerenciar cadernos"
          onClick={() => router.push("/cadernos")}
        />
        <ActionCard
          icon={<Users className="h-5 w-5" />}
          title="Compartilhado comigo"
          description="Ver itens compartilhados"
          onClick={() => router.push("/compartilhados")}
        />
        <ActionCard
          icon={<Building2 className="h-5 w-5" />}
          title="Espaço"
          description="Gerenciar espaços"
          onClick={() => router.push("/espacos")}
        />
      </div>

      <div className="mb-10">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Clock className="h-4 w-4" />
          Recentes
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : recentDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Nenhum documento recente</p>
            <Button variant="link" size="sm" className="mt-1" onClick={handleCreateDocument}>
              Criar seu primeiro documento
            </Button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {recentDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => router.push(`/documents/${doc.id}`)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              >
                {doc.icon ? (
                  <span className="text-base">{doc.icon}</span>
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="truncate font-medium">{doc.title || "Sem título"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div id="folder-projects-section" className="mb-10">
        <SectionTitle icon={<FolderOpen className="h-4 w-4" />} title="Pastas" />
        {folderProjects.length === 0 ? (
          <EmptySection text="Nenhuma pasta criada ainda." />
        ) : (
          <div className="space-y-1">
            {folderProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => router.push(`/documents?project=${project.id}`)}
                className="flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left hover:bg-accent transition-colors"
              >
                <span className="text-base">{project.icon || "📁"}</span>
                <span className="flex-1 truncate font-medium">{project.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div id="notebook-projects-section" className="mb-10">
        <SectionTitle icon={<BookOpenText className="h-4 w-4" />} title="Cadernos" />
        {notebookProjects.length === 0 ? (
          <EmptySection text="Nenhum caderno criado ainda." />
        ) : (
          <div className="space-y-1">
            {notebookProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => router.push(`/documents?project=${project.id}`)}
                className="flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left hover:bg-accent transition-colors"
              >
                <span className="text-base">{project.icon || "📓"}</span>
                <span className="flex-1 truncate font-medium">{project.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div id="shared-projects-section" className="mb-10">
        <SectionTitle icon={<Users className="h-4 w-4" />} title="Compartilhados comigo" />
        {sharedProjects.length === 0 ? (
          <EmptySection text="Nenhum projeto compartilhado com você." />
        ) : (
          <div className="space-y-1">
            {sharedProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => router.push(`/documents?project=${project.id}`)}
                className="flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left hover:bg-accent transition-colors"
              >
                <span className="text-base">{project.icon || "🤝"}</span>
                <span className="flex-1 truncate font-medium">{project.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div id="spaces-section" className="mb-6">
        <SectionTitle icon={<Building2 className="h-4 w-4" />} title="Espaços" />
        {spaces.length === 0 ? (
          <EmptySection text="Nenhum espaço criado ainda." />
        ) : (
          <div className="space-y-1">
            {spaces.map((space) => (
              <button
                key={space.id}
                onClick={() => router.push(`/documents?space=${space.id}`)}
                className="flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left hover:bg-accent transition-colors"
              >
                <span className="text-base">{space.icon || "🏢"}</span>
                <span className="flex-1 truncate font-medium">{space.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
    >
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
      {icon}
      {title}
    </div>
  );
}

function EmptySection({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function resolveProjectKind(project: Project): ProjectKind {
  if (
    project.kind === "folder" ||
    project.kind === "notebook" ||
    project.kind === "shared-project"
  ) {
    return project.kind;
  }

  if ((project.icon || "").includes("📓")) {
    return "notebook";
  }

  return "folder";
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
