"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { useTemplateStore } from "@/stores/template-store";
import { TemplateGallery } from "./template-gallery";
import { 
  getSystemTemplates, 
  getUserTemplates, 
  createDocument,
  incrementTemplateUsage 
} from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Template } from "@/types/smart-note";
import { FilePlus, Sparkles } from "lucide-react";
import { PREDEFINED_TEMPLATES } from "@/lib/templates/predefined-templates";
import { Button } from "@/components/ui/button";

export function TemplateSelectorModal() {
  const { isOpen, onClose } = useTemplateStore();
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [systemTemplates, userTemplates] = await Promise.all([
        getSystemTemplates(),
        getUserTemplates(user.uid),
      ]);
      
      let allTemplates = [...systemTemplates, ...userTemplates];
      
      if (systemTemplates.length === 0) {
        const predefinedAsTemplates = PREDEFINED_TEMPLATES.map(t => ({
          ...t,
          userId: "system",
          usageCount: 0,
          createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
          updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
        } as unknown as Template));
        
        allTemplates = [...predefinedAsTemplates, ...userTemplates];
      }

      setTemplates(allTemplates);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      loadTemplates();
    }
  }, [isOpen, user, loadTemplates]);

  const handleSelectTemplate = async (template: Template | null) => {
    if (!user) return;
    
    try {
      const docData = template ? {
        title: template.name,
        content: template.content,
        icon: template.icon,
      } : {
        title: "",
        content: null,
        icon: "",
      };

      const docId = await createDocument(user.uid, docData);
      
      if (template && !template.id.startsWith("system-")) {
        const isSystem = template.userId === "system";
        try {
          await incrementTemplateUsage(template.id, isSystem, isSystem ? undefined : user.uid);
        } catch (e) {
          console.warn("Could not increment template usage:", e);
        }
      }

      toast.success(template ? `Criado: ${template.name}` : "Nova nota criada");
      onClose();
      router.push(`/documents/${docId}`);
    } catch (error) {
      console.error("Error creating document from template:", error);
      toast.error("Erro ao criar documento.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2 font-bold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            O que vamos criar hoje?
          </DialogTitle>
          <DialogDescription className="text-base">
            Escolha um template para começar com estrutura ou uma nota em branco.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div 
            className="group mb-8 p-5 border-2 border-dashed rounded-2xl flex items-center justify-between hover:bg-accent/50 hover:border-primary/50 cursor-pointer transition-all active:scale-[0.98]"
            onClick={() => handleSelectTemplate(null)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <FilePlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Nota em branco</h3>
                <p className="text-sm text-muted-foreground">Comece do zero sem formatação prévia.</p>
              </div>
            </div>
            <div className="hidden sm:block text-xs font-bold text-primary px-4 py-1.5 bg-primary/10 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              Pular →
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
              Templates Disponíveis
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <TemplateGallery 
            templates={templates}
            onSelect={handleSelectTemplate}
            isLoading={isLoading}
          />

          <div className="mt-8 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                router.push("/settings/templates");
              }}
              className="w-full text-xs font-bold uppercase tracking-widest py-6"
            >
              Gerenciar Meus Templates
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
