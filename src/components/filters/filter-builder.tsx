"use client";

import { useState } from "react";
import { Plus, Trash2, Filter, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterGroup, FilterRule, FilterOperator } from "@/types/view";

interface FilterBuilderProps {
  initialFilter?: FilterGroup;
  onChange: (filter: FilterGroup) => void;
  onSave?: (filter: FilterGroup) => void;
}

const FIELDS = [
  { label: "Título", value: "title" },
  { label: "Status", value: "status" },
  { label: "Prioridade", value: "priority" },
  { label: "Responsável", value: "assigneeId" },
  { label: "Data de Entrega", value: "dueDate" },
  { label: "Tags", value: "labels" },
];

const OPERATORS: { label: string; value: FilterOperator }[] = [
  { label: "é igual a", value: "equals" },
  { label: "não é igual a", value: "not_equals" },
  { label: "contém", value: "contains" },
  { label: "não contém", value: "not_contains" },
  { label: "está vazio", value: "is_empty" },
  { label: "não está vazio", value: "is_not_empty" },
  { label: "maior que", value: "greater_than" },
  { label: "menor que", value: "less_than" },
];

export function FilterBuilder({ initialFilter, onChange, onSave }: FilterBuilderProps) {
  const [filter, setFilter] = useState<FilterGroup>(
    initialFilter || { id: "root", logic: "AND", rules: [] }
  );

  const updateFilter = (newFilter: FilterGroup) => {
    setFilter(newFilter);
    onChange(newFilter);
  };

  const addRule = () => {
    const newRule: FilterRule = {
      id: Math.random().toString(36).substring(7),
      field: "title",
      operator: "contains",
      value: "",
    };
    updateFilter({
      ...filter,
      rules: [...filter.rules, newRule],
    });
  };

  const removeRule = (id: string) => {
    updateFilter({
      ...filter,
      rules: filter.rules.filter((r) => !isFilterRule(r) || r.id !== id),
    });
  };

  const updateRule = (id: string, updates: Partial<FilterRule>) => {
    updateFilter({
      ...filter,
      rules: filter.rules.map((r) =>
        isFilterRule(r) && r.id === id ? { ...r, ...updates } : r
      ),
    });
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Construtor de Filtros
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filter.logic}
            onValueChange={(value: "AND" | "OR") => updateFilter({ ...filter, logic: value })}
          >
            <SelectTrigger className="h-8 w-[80px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">E</SelectItem>
              <SelectItem value="OR">OU</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        {filter.rules.filter(isFilterRule).map((rule) => (
          <div key={rule.id} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <Select
              value={rule.field}
              onValueChange={(value) => updateRule(rule.id, { field: value })}
            >
              <SelectTrigger className="h-9 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELDS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={rule.operator}
              onValueChange={(value: FilterOperator) => updateRule(rule.id, { operator: value })}
            >
              <SelectTrigger className="h-9 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!["is_empty", "is_not_empty"].includes(rule.operator) && (
              <Input
                className="h-9 flex-[1.5]"
                value={
                  typeof rule.value === "string" || typeof rule.value === "number"
                    ? String(rule.value)
                    : ""
                }
                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                placeholder="Valor..."
              />
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
              onClick={() => removeRule(rule.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={addRule}
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar Filtro
        </Button>

        {onSave && filter.rules.length > 0 && (
          <Button
            variant="default"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => onSave(filter)}
          >
            <Save className="h-3.5 w-3.5" />
            Salvar Visualização
          </Button>
        )}
      </div>
    </div>
  );
}

function isFilterRule(rule: FilterRule | FilterGroup): rule is FilterRule {
  return "field" in rule && "operator" in rule && "value" in rule;
}
