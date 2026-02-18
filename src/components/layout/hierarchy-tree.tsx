"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  List as ListIcon, 
  MoreHorizontal, 
  Plus,
  Trash2,
  Edit2,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Space } from "@/types/space";
import { Folder as FolderType } from "@/types/folder";
import { List as ListType } from "@/types/list";
import { 
  subscribeToFolders, 
  subscribeToLists, 
  createFolder, 
  createList,
  deleteSpace
} from "@/lib/firebase/spaces";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { useSpaceStore } from "@/stores/space-store";

// DND Kit Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HierarchyTreeProps {
  spaces: Space[];
}

type DragListeners = ReturnType<typeof useSortable>["listeners"];

export function HierarchyTree({ spaces }: HierarchyTreeProps) {
  const { reorderSpaces } = useSpaceStore();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = spaces.findIndex((s) => s.id === active.id);
      const newIndex = spaces.findIndex((s) => s.id === over.id);
      
      const newOrder = arrayMove(spaces, oldIndex, newIndex);
      reorderSpaces(newOrder);
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={spaces.map(s => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {spaces.map((space) => (
            <SortableSpaceItem key={space.id} space={space} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableSpaceItem({ space }: { space: Space }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: space.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <SpaceItem space={space} dragListeners={listeners} />
    </div>
  );
}

function SpaceItem({ space, dragListeners }: { space: Space, dragListeners: DragListeners }) {
  const { user } = useAuth();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [lists, setLists] = useState<ListType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const unsubFolders = subscribeToFolders(space.id, setFolders);
      const unsubLists = subscribeToLists(space.id, (data) => {
        setLists(data.filter(l => !l.folderId));
        setLoading(false);
      });
      return () => {
        unsubFolders();
        unsubLists();
      };
    }
  }, [isOpen, space.id]);

  const handleAddFolder = async () => {
    if (!user) return;
    const name = prompt("Nome da pasta:");
    if (!name) return;
    try {
      await createFolder({
        spaceId: space.id,
        name,
        icon: "📁",
        color: space.color,
        userId: user.uid
      });
      setIsOpen(true);
      toast.success("Pasta criada!");
    } catch {
      toast.error("Erro ao criar pasta.");
    }
  };

  const handleAddList = async () => {
    if (!user) return;
    const name = prompt("Nome da lista:");
    if (!name) return;
    try {
      await createList({
        spaceId: space.id,
        name,
        icon: "📋",
        color: space.color,
        userId: user.uid,
        viewType: "list"
      });
      setIsOpen(true);
      toast.success("Lista criada!");
    } catch {
      toast.error("Erro ao criar lista.");
    }
  };

  const handleDelete = async () => {
    if (confirm(`Excluir espaço "${space.name}" e tudo dentro dele?`)) {
      await deleteSpace(space.id);
      toast.success("Espaço excluído.");
    }
  };

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 group cursor-pointer text-sm font-medium transition-colors",
          isOpen && "bg-accent/30",
          params.spaceId === space.id && "text-primary bg-primary/5"
        )}
        onClick={() => {
          if (!isOpen) {
            setLoading(true);
          }
          setIsOpen(!isOpen);
        }}
      >
        <div 
          className="p-1 -ml-1 rounded-sm hover:bg-accent cursor-grab active:cursor-grabbing text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity"
          {...dragListeners}
        >
          <GripVertical className="h-3 w-3" />
        </div>

        <div className="p-0.5 rounded-sm hover:bg-accent transition-transform duration-200">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
        <span className="text-base shrink-0">{space.icon || "🪐"}</span>
        <span className="flex-1 truncate">{space.name}</span>
        
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); handleAddList(); }}
            className="p-1 hover:bg-background rounded-sm text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-background rounded-sm text-muted-foreground" onClick={e => e.stopPropagation()}>
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleAddFolder}>
                <Folder className="h-4 w-4 mr-2" /> Nova Pasta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddList}>
                <ListIcon className="h-4 w-4 mr-2" /> Nova Lista
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit2 className="h-4 w-4 mr-2" /> Renomear
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-500" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-4 border-l ml-3.5 my-0.5 border-border/40 space-y-0.5"
          >
            {folders.map(folder => (
              <FolderItem key={folder.id} folder={folder} spaceColor={space.color} />
            ))}
            {lists.map(list => (
              <ListItem key={list.id} list={list} />
            ))}
            {!loading && folders.length === 0 && lists.length === 0 && (
              <div className="text-[10px] text-muted-foreground/60 px-6 py-1 italic">Vazio</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FolderItem({ folder, spaceColor }: { folder: FolderType, spaceColor: string }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState<ListType[]>([]);

  useEffect(() => {
    if (isOpen) {
      const unsubLists = subscribeToLists(folder.spaceId, (data) => {
        setLists(data.filter(l => l.folderId === folder.id));
      });
      return () => unsubLists();
    }
  }, [isOpen, folder.spaceId, folder.id]);

  const handleAddList = async () => {
    if (!user) return;
    const name = prompt("Nome da lista na pasta:");
    if (!name) return;
    await createList({
      spaceId: folder.spaceId,
      folderId: folder.id,
      name,
      icon: "📋",
      color: spaceColor,
      userId: user.uid
    });
    setIsOpen(true);
  };

  return (
    <div className="group/folder">
      <div 
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent/50 cursor-pointer text-sm text-muted-foreground transition-colors group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-3 flex justify-center">
          {isOpen ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
        </div>
        <Folder className="h-3.5 w-3.5 shrink-0 text-amber-500/70" />
        <span className="truncate flex-1">{folder.name}</span>
        
        <button 
          onClick={(e) => { e.stopPropagation(); handleAddList(); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-background rounded-sm"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="pl-4 border-l ml-3.5 border-border/20 overflow-hidden"
          >
            {lists.map(list => <ListItem key={list.id} list={list} />)}
            {lists.length === 0 && (
              <div className="text-[9px] text-muted-foreground/40 px-6 py-1">Pasta vazia</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ListItem({ list }: { list: ListType }) {
  const router = useRouter();
  const params = useParams();
  
  const isActive = params.listId === list.id;

  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent/50 cursor-pointer text-sm transition-colors group",
        isActive ? "text-foreground font-medium bg-accent/40" : "text-muted-foreground"
      )}
      onClick={() => router.push(`/spaces/${list.spaceId}/lists/${list.id}`)}
    >
      <div className="w-3" />
      <ListIcon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground/60")} />
      <span className="truncate flex-1">{list.name}</span>
      
      <div className="opacity-0 group-hover:opacity-100">
        <MoreHorizontal className="h-3 w-3 text-muted-foreground/40" />
      </div>
    </div>
  );
}
