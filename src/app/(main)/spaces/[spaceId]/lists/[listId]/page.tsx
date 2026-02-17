"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { subscribeToListDocuments } from "@/lib/firebase/firestore";
import { subscribeToListTasks } from "@/lib/firebase/tasks";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Document } from "@/types/document";
import { Task, List as ListType } from "@/types/smart-note";
import { TasksPanel } from "@/components/smart/tasks-panel";
import { FileText, Plus, List as ListIcon, Settings, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { createDocument } from "@/lib/firebase/firestore";
import { toast } from "sonner";

export default function ListViewPage() {
  const params = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const listId = params.listId as string;
  const spaceId = params.spaceId as string;

  const [list, setList] = useState<any>(null);
  const [spaceName, setSpaceName] = useState("");
  const [folderName, setFolderName] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !listId) return;

    const fetchData = async () => {
      try {
        // Fetch List
        const listSnap = await getDoc(doc(db!, "lists", listId));
        if (listSnap.exists()) {
          const listData = listSnap.data();
          setList({ id: listSnap.id, ...listData });
          
          // Fetch Space
          if (listData.spaceId) {
            const spaceSnap = await getDoc(doc(db!, "spaces", listData.spaceId));
            if (spaceSnap.exists()) setSpaceName(spaceSnap.data().name);
          }

          // Fetch Folder if exists
          if (listData.folderId) {
            const folderSnap = await getDoc(doc(db!, "folders", listData.folderId));
            if (folderSnap.exists()) setFolderName(folderSnap.data().name);
          }
        }
      } catch (error) {
        console.error("Error fetching hierarchy:", error);
      }
    };
    fetchData();

    const unsubDocs = subscribeToListDocuments(user.uid, listId, setDocuments);
    const unsubTasks = subscribeToListTasks(user.uid, listId, (data) => {
      setTasks(data);
      setLoading(false);
    });

    return () => {
      unsubDocs();
      unsubTasks();
    };
  }, [user, listId]);

  const handleCreateDoc = async () => {
    if (!user) return;
    try {
      const docId = await createDocument(user.uid, {
        title: "Novo Documento",
        spaceId,
        listId,
      });
      router.push(`/documents/${docId}`);
    } catch {
      toast.error("Erro ao criar documento.");
    }
  };

  if (loading && !list) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Breadcrumbs Header */}
      <div className="px-8 pt-6 pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors">
            <Home className="h-3.5 w-3.5" />
            <span>Espaços</span>
          </div>
          {spaceName && (
            <>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span className="hover:text-foreground cursor-pointer transition-colors">{spaceName}</span>
            </>
          )}
          {folderName && (
            <>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span className="hover:text-foreground cursor-pointer transition-colors">{folderName}</span>
            </>
          )}
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="font-medium text-foreground">{list?.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ListIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{list?.name || "Lista"}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                {tasks.length} tarefas • {documents.length} documentos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" /> Configurações
            </Button>
            <Button size="sm" className="gap-2" onClick={handleCreateDoc}>
              <Plus className="h-4 w-4" /> Novo Item
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 pb-6 flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="tasks" className="w-full flex-1 flex flex-col">
          <div className="border-b mb-6">
            <TabsList className="h-9 bg-transparent p-0">
              <TabsTrigger 
                value="tasks" 
                className="gap-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                Tarefas 
              </TabsTrigger>
              <TabsTrigger 
                value="documents" 
                className="gap-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                Documentos 
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tasks" className="m-0 border-none p-0 flex-1 overflow-hidden">
            <div className="h-full rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
              <TasksPanel 
                documentId={null} 
                listId={listId}
                isInline
                forcedTasks={tasks}
              />
            </div>
          </TabsContent>

          <TabsContent value="documents" className="m-0 border-none p-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
              {documents.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  className="p-4 border rounded-xl hover:border-primary cursor-pointer transition-all bg-card group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{doc.icon || "📄"}</span>
                      <div>
                        <h3 className="font-bold group-hover:text-primary truncate max-w-[150px]">
                          {doc.title || "Sem título"}
                        </h3>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          Atualizado {new Date(doc.updatedAt.toMillis()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={handleCreateDoc}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl hover:bg-muted/50 transition-colors gap-2 text-muted-foreground min-h-[100px]"
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Novo Documento</span>
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
