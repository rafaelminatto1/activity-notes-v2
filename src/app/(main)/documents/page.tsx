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
  Users,
  Search,
  LayoutGrid,
  Plus,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredRecents = useMemo(() => {
    if (!searchQuery) return recentDocs;
    return recentDocs.filter(doc => 
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recentDocs, searchQuery]);

  if (projectId && currentProject) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push("/documents")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm"
                style={{ backgroundColor: `${currentProject.color}20`, color: currentProject.color }}
              >
                {currentProject.icon || "📁"}
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">{currentProject.name}</h1>
                <p className="text-sm text-muted-foreground">{projectDocs.length} documentos encontrados</p>
              </div>
            </div>
          </div>
          <Button onClick={handleCreateDocument} size="lg" className="rounded-full shadow-md transition-all hover:shadow-lg">
            <Plus className="mr-2 h-5 w-5" />
            Novo Documento
          </Button>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))
            ) : (
              projectDocs.map((doc, idx) => (
                <DocumentCard key={doc.id} doc={doc} idx={idx} onClick={() => router.push(`/documents/${doc.id}`)} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (spaceId && currentSpace) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push("/documents")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm"
                style={{ backgroundColor: `${currentSpace.color}20`, color: currentSpace.color }}
              >
                {currentSpace.icon || "🏢"}
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">{currentSpace.name}</h1>
                <p className="text-sm text-muted-foreground">{spaceDocs.length} documentos neste espaço</p>
              </div>
            </div>
          </div>
          <Button onClick={handleCreateDocument} size="lg" className="rounded-full shadow-md transition-all hover:shadow-lg">
            <Plus className="mr-2 h-5 w-5" />
            Novo Documento
          </Button>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))
            ) : (
              spaceDocs.map((doc, idx) => (
                <DocumentCard key={doc.id} doc={doc} idx={idx} onClick={() => router.push(`/documents/${doc.id}`)} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      {/* Dashboard Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-2">
            {greeting}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {firstName ? `, ${firstName}` : "!"}
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md font-medium">
            O que vamos criar hoje? Comece uma nova nota ou continue seu projeto.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:max-w-md sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Buscar em recentes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-full bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary shadow-inner"
            />
          </div>
          <Button onClick={handleCreateDocument} size="lg" className="h-11 rounded-full shadow-md hover:shadow-lg transition-all px-6">
            <Plus className="mr-2 h-5 w-5" />
            Criar Nota
          </Button>
        </div>
      </motion.div>

      {/* Quick Actions Grid */}
      <div className="mb-14 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <ActionCard
          icon={<FolderOpen className="h-6 w-6" />}
          title="Pastas"
          description="Projetos organizados"
          color="bg-blue-500"
          onClick={() => router.push("/pastas")}
        />
        <ActionCard
          icon={<BookOpenText className="h-6 w-6" />}
          title="Cadernos"
          description="Ideias em sequência"
          color="bg-orange-500"
          onClick={() => router.push("/cadernos")}
        />
        <ActionCard
          icon={<Users className="h-6 w-6" />}
          title="Shared"
          description="Trabalho em equipe"
          color="bg-green-500"
          onClick={() => router.push("/compartilhados")}
        />
        <ActionCard
          icon={<Building2 className="h-6 w-6" />}
          title="Espaços"
          description="Ambientes isolados"
          color="bg-purple-500"
          onClick={() => router.push("/espacos")}
        />
      </div>

      {/* Recents Section */}
      <div className="mb-14">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Documentos Recentes</h2>
          </div>
          {recentDocs.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LayoutGrid className="h-4 w-4" />
              <span>Grid View</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : filteredRecents.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-muted/50 py-20 bg-muted/5"
          >
            <div className="mb-4 rounded-full bg-muted p-6">
              <FileText className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <p className="text-xl font-semibold text-muted-foreground">Nenhum documento encontrado</p>
            <p className="mt-2 text-muted-foreground">Que tal criar seu primeiro registro agora?</p>
            <Button size="lg" variant="outline" className="mt-6 rounded-full" onClick={handleCreateDocument}>
              Começar Documento
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredRecents.map((doc, idx) => (
                <DocumentCard 
                  key={doc.id} 
                  doc={doc} 
                  idx={idx}
                  onClick={() => router.push(`/documents/${doc.id}`)} 
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Hierarchical Collections Section */}
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Folders & Notebooks */}
        <div className="space-y-10">
          <section>
            <SectionTitle icon={<FolderOpen className="h-5 w-5" />} title="Minhas Pastas" action={() => router.push("/pastas")} />
            <div className="grid gap-3">
              {folderProjects.length === 0 ? (
                <EmptySection text="Nenhuma pasta criada ainda." />
              ) : (
                folderProjects.map((project, idx) => (
                  <CollectionItem 
                    key={project.id} 
                    idx={idx}
                    icon={project.icon || "📁"} 
                    title={project.name} 
                    onClick={() => router.push(`/documents?project=${project.id}`)} 
                  />
                ))
              )}
            </div>
          </section>

          <section>
            <SectionTitle icon={<BookOpenText className="h-5 w-5" />} title="Meus Cadernos" action={() => router.push("/cadernos")} />
            <div className="grid gap-3">
              {notebookProjects.length === 0 ? (
                <EmptySection text="Nenhum caderno criado ainda." />
              ) : (
                notebookProjects.map((project, idx) => (
                  <CollectionItem 
                    key={project.id} 
                    idx={idx}
                    icon={project.icon || "📓"} 
                    title={project.name} 
                    onClick={() => router.push(`/documents?project=${project.id}`)} 
                  />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Spaces & Shared */}
        <div className="space-y-10">
          <section>
            <SectionTitle icon={<Building2 className="h-5 w-5" />} title="Espaços de Trabalho" action={() => router.push("/espacos")} />
            <div className="grid gap-3">
              {spaces.length === 0 ? (
                <EmptySection text="Nenhum espaço configurado." />
              ) : (
                spaces.map((space, idx) => (
                  <CollectionItem 
                    key={space.id} 
                    idx={idx}
                    icon={space.icon || "🏢"} 
                    title={space.name} 
                    onClick={() => router.push(`/documents?space=${space.id}`)} 
                  />
                ))
              )}
            </div>
          </section>

          <section>
            <SectionTitle icon={<Users className="h-5 w-5" />} title="Compartilhados" action={() => router.push("/compartilhados")} />
            <div className="grid gap-3">
              {sharedProjects.length === 0 ? (
                <EmptySection text="Nada compartilhado com você no momento." />
              ) : (
                sharedProjects.map((project, idx) => (
                  <CollectionItem 
                    key={project.id} 
                    idx={idx}
                    icon={project.icon || "🤝"} 
                    title={project.name} 
                    onClick={() => router.push(`/documents?project=${project.id}`)} 
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ doc, idx, onClick }: { doc: Document; idx: number; onClick: () => void }) {
  const lastUpdate = doc.updatedAt?.toMillis?.() 
    ? formatDistanceToNow(doc.updatedAt.toMillis(), { addSuffix: true, locale: ptBR })
    : "Recentemente";

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="group relative flex h-48 flex-col justify-between overflow-hidden rounded-3xl border bg-card p-6 text-left shadow-sm transition-all hover:shadow-xl hover:border-primary/20 dark:hover:bg-accent/30"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted transition-colors group-hover:bg-primary/10">
          <span className="text-3xl">{doc.icon || "📄"}</span>
        </div>
        {doc.isPublished && (
          <div className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-green-600">
            <span className="h-1 w-1 rounded-full bg-green-600 animate-pulse" />
            Live
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="line-clamp-2 font-bold text-lg leading-tight group-hover:text-primary transition-colors">
          {doc.title || "Sem título"}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{lastUpdate}</span>
        </div>
      </div>

      {/* Decorative gradient */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl transition-opacity group-hover:opacity-100 opacity-0" />
    </motion.button>
  );
}

function ActionCard({
  icon,
  title,
  description,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col gap-4 rounded-3xl border bg-card p-5 text-left transition-all hover:shadow-lg hover:border-muted-foreground/20"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} text-white shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold">{title}</p>
        <p className="text-sm text-muted-foreground leading-tight">{description}</p>
      </div>
    </motion.button>
  );
}

function CollectionItem({ icon, title, onClick, idx }: { icon: string; title: string; onClick: () => void, idx: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.05 }}
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border bg-card px-4 py-3.5 text-left transition-all hover:bg-accent hover:border-primary/20"
    >
      <span className="text-2xl filter group-hover:drop-shadow-sm transition-all">{icon}</span>
      <span className="flex-1 truncate font-semibold text-sm">{title}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </motion.button>
  );
}

function SectionTitle({ icon, title, action }: { icon: React.ReactNode; title: string; action?: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="rounded-lg bg-muted p-1.5 text-muted-foreground">
          {icon}
        </div>
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      </div>
      {action && (
        <Button variant="ghost" size="sm" onClick={action} className="text-xs font-bold text-primary hover:bg-primary/10">
          Ver todos
        </Button>
      )}
    </div>
  );
}

function EmptySection({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed px-5 py-8 text-sm text-muted-foreground bg-muted/5">
      <Sparkles className="h-5 w-5 opacity-20" />
      <span>{text}</span>
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
  if (hour < 5) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
