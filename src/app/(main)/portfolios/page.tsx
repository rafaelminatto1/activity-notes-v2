"use client";

import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  Plus, 
  ArrowRight, 
  Trash2, 
  LayoutGrid,
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { 
  subscribeToPortfolios, 
  createPortfolio, 
  deletePortfolio 
} from "@/lib/firebase/portfolios";
import { useProjectStore } from "@/stores/project-store";
import { Portfolio } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function PortfoliosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { projects } = useProjectStore();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [name, setName] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeToPortfolios(user.uid, (data) => {
      setPortfolios(data);
      setIsLoading(false);
    });
  }, [user]);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    if (selectedProjectIds.length === 0) {
      toast.error("Selecione pelo menos um projeto.");
      return;
    }

    try {
      const id = await createPortfolio(user.uid, name, selectedProjectIds);
      setIsModalOpen(false);
      setName("");
      setSelectedProjectIds([]);
      router.push(`/portfolios/${id}`);
      toast.success("Portfólio criado!");
    } catch (error) {
      toast.error("Erro ao criar portfólio.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Excluir este portfólio?")) return;
    try {
      await deletePortfolio(id);
      toast.success("Portfólio excluído.");
    } catch (error) {
      toast.error("Erro ao excluir.");
    }
  };

  const toggleProject = (id: string) => {
    setSelectedProjectIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Portfólios</h1>
            <p className="text-muted-foreground">Visão estratégica de múltiplos projetos.</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Portfólio
        </Button>
      </div>

      {portfolios.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-50">
          <LayoutGrid className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold">Nenhum portfólio ainda</h3>
          <p className="mt-2 mb-6">Crie um portfólio para acompanhar o progresso dos seus projetos.</p>
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>Criar meu primeiro portfólio</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((p) => (
            <Card 
              key={p.id} 
              className="group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => router.push(`/portfolios/${p.id}`)}
            >
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => handleDelete(e, p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{p.name}</CardTitle>
                <CardDescription>{p.projectIds.length} projetos incluídos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-primary">
                  Ver detalhes <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Portfólio</DialogTitle>
            <DialogDescription>Agrupe projetos para acompanhar o progresso global.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Portfólio</Label>
              <Input 
                id="name" 
                placeholder="Ex: Projetos Q1, Roadmap Produto..." 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label>Selecionar Projetos</Label>
              <div className="max-h-[250px] overflow-y-auto border rounded-lg p-2 space-y-1 bg-muted/10">
                {projects.map(project => (
                  <div key={project.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md transition-colors">
                    <Checkbox 
                      id={project.id} 
                      checked={selectedProjectIds.includes(project.id)}
                      onCheckedChange={() => toggleProject(project.id)}
                    />
                    <label htmlFor={project.id} className="text-sm font-medium leading-none cursor-pointer flex-1 flex items-center gap-2">
                      <span>{project.icon}</span>
                      <span>{project.name}</span>
                    </label>
                  </div>
                ))}
                {projects.length === 0 && <p className="text-xs text-center py-4 text-muted-foreground">Nenhum projeto disponível.</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>Criar Portfólio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
