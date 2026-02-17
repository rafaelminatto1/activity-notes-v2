"use client";

import React, { useState, useEffect } from "react";
import { 
  Layout, 
  Plus, 
  ArrowLeft, 
  Trash2,
  Edit,
  ExternalLink
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { 
  getUserTemplates, 
  getSystemTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate,
  toggleFavoriteTemplate 
} from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Template } from "@/types/smart-note";
import { TemplateGallery } from "@/components/smart/template-gallery";
import { TemplateEditor } from "@/components/smart/template-editor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PREDEFINED_TEMPLATES } from "@/lib/templates/predefined-templates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TemplatesSettingsPage() {
  const router = useRouter();
  const { user, userProfile, refreshProfile } = useAuth();
  
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [systemTemplates, setSystemTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadTemplates = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [uTemplates, sTemplates] = await Promise.all([
        getUserTemplates(user.uid),
        getSystemTemplates(),
      ]);
      setUserTemplates(uTemplates);
      
      if (sTemplates.length === 0) {
        // Fallback to predefined
        const predefinedAsTemplates = PREDEFINED_TEMPLATES.map(t => ({
          ...t,
          userId: "system",
          usageCount: 0,
          createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
          updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
        } as unknown as Template));
        setSystemTemplates(predefinedAsTemplates);
      } else {
        setSystemTemplates(sTemplates);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Erro ao carregar templates.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user, loadTemplates]);

  const handleCreateTemplate = () => {
    setEditingTemplate({
      content: { type: "doc", content: [] },
      icon: "📄",
      color: "#6366f1",
      category: "Geral"
    });
    setIsEditorOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleSaveTemplate = async (data: Partial<Template>) => {
    if (!user) return;
    try {
      if (editingTemplate?.id) {
        await updateTemplate(user.uid, editingTemplate.id, data);
        toast.success("Template atualizado!");
      } else {
        await createTemplate(user.uid, data);
        toast.success("Template criado com sucesso!");
      }
      loadTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      throw error;
    }
  };

  const handleDeleteTemplate = async () => {
    if (!user || !deleteConfirmId) return;
    try {
      await deleteTemplate(user.uid, deleteConfirmId);
      toast.success("Template excluído.");
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Erro ao excluir template.");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    if (!user) return;
    try {
      await toggleFavoriteTemplate(user.uid, id);
      await refreshProfile();
      toast.success("Favoritos atualizados.");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Erro ao atualizar favorito.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Layout className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Templates</h1>
          </div>
        </div>
        <Button onClick={handleCreateTemplate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
      </div>

      <p className="text-muted-foreground">
        Gerencie seus modelos personalizados e descubra templates do sistema para acelerar seu fluxo de trabalho.
      </p>

      <Tabs defaultValue="user">
        <TabsList>
          <TabsTrigger value="user">Meus Templates</TabsTrigger>
          <TabsTrigger value="system">Explorar (Sistema)</TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="mt-6 space-y-6">
          {userTemplates.length === 0 && !isLoading ? (
            <div className="text-center py-20 border-2 border-dashed rounded-2xl">
              <Layout className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold">Você ainda não tem templates</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Crie seu primeiro template do zero ou salve uma nota existente como template.
              </p>
              <Button onClick={handleCreateTemplate} variant="outline" className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeiro Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userTemplates.map((template) => (
                <div key={template.id} className="group relative flex flex-col bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all">
                  <div className="h-1.5 w-full" style={{ backgroundColor: template.color }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <h4 className="font-bold text-foreground line-clamp-1">{template.name}</h4>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            {template.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 h-8 mb-4">
                      {template.description || "Sem descrição."}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteConfirmId(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => {
                        // In a real app, maybe open a preview/use dialog
                        toast.info("Acesse através do botão 'Novo' na barra lateral.");
                      }}>
                        Usar <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <TemplateGallery 
            templates={systemTemplates}
            favorites={userProfile?.favoriteTemplateIds}
            onSelect={(t) => {
              // Option to preview or copy
              toast.info(`Template do sistema: ${t.name}. Selecione no menu 'Novo' para usar.`);
            }}
            onToggleFavorite={handleToggleFavorite}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {isEditorOpen && (
        <TemplateEditor
          template={editingTemplate || {}}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveTemplate}
        />
      )}

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template será removido permanentemente da sua lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
