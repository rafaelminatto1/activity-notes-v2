"use client";

import React, { useState, useMemo } from "react";
import { Search, Star, Layout, ChevronRight, Info } from "lucide-react";
import { Template } from "@/types/smart-note";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TemplateGalleryProps {
  templates: Template[];
  favorites?: string[];
  onSelect: (template: Template) => void;
  onToggleFavorite?: (templateId: string) => void;
  isLoading?: boolean;
}

export function TemplateGallery({
  templates,
  favorites = [],
  onSelect,
  onToggleFavorite,
  isLoading = false,
}: TemplateGalleryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category));
    return ["All", ...Array.from(cats)].sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchTerm, selectedCategory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar templates..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="rounded-full"
            >
              {cat === "All" ? "Todos" : cat}
            </Button>
          ))}
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <Layout className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Nenhum template encontrado
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Tente mudar os filtros ou o termo de busca.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const isFavorite = favorites.includes(template.id);
            return (
              <div
                key={template.id}
                className="group relative flex flex-col bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer"
                onClick={() => onSelect(template)}
              >
                <div 
                  className="h-2 w-full" 
                  style={{ backgroundColor: template.color || "#6366f1" }}
                />
                <div className="p-4 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 bg-muted rounded-lg group-hover:scale-110 transition-transform">
                        {template.icon}
                      </span>
                      <div>
                        <h4 className="font-semibold text-foreground leading-tight">
                          {template.name}
                        </h4>
                        <Badge variant="secondary" className="mt-1 text-[10px] h-4">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                    {onToggleFavorite && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 rounded-full",
                          isFavorite ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(template.id);
                        }}
                      >
                        <Star className={cn("w-4 h-4", isFavorite && "fill-current")} />
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t mt-auto">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      {template.usageCount || 0} usos
                    </span>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Info className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Clique para visualizar e usar este template</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button size="sm" className="h-8 text-xs gap-1">
                        Usar <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
