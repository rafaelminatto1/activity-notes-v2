"use client";

import { useProjectStore } from "@/stores/project-store";
import { cn } from "@/lib/utils";
import { Folder, MoreHorizontal, Pencil, Trash2, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { ProjectModal } from "./project-modal"; // Will Create next
import { motion, AnimatePresence } from "framer-motion";

export function ProjectList() {
    const { projects, activeProjectId, selectProject, deleteProject } = useProjectStore();
    const router = useRouter();
    const [editingProject, setEditingProject] = useState<string | null>(null);

    const handleProjectClick = (projectId: string) => {
        selectProject(projectId);
        // Maybe route to a project view page or filter dashboard?
        // For now, let's assume it filters the document list which is the common pattern
    };

    const handleEdit = (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingProject(projectId);
    };

    const handleDelete = async (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Tem certeza que deseja excluir este projeto?")) {
            await deleteProject(projectId);
        }
    };

    return (
        <>
            <div className="space-y-1">
                <AnimatePresence initial={false}>
                    {projects.map((project) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            layout
                        >
                            <motion.div
                                role="button"
                                onClick={() => handleProjectClick(project.id)}
                                whileHover={{ scale: 1.02, x: 4, backgroundColor: "rgba(var(--accent), 0.1)" }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "group flex w-full items-center gap-2 rounded-sm px-3 py-1 text-sm text-muted-foreground transition-colors cursor-pointer",
                                    activeProjectId === project.id && "bg-accent text-accent-foreground font-medium"
                                )}
                            >
                                <span className="text-base shrink-0">
                                    {project.icon || <Folder className="h-4 w-4" />}
                                </span>

                                <span className="truncate flex-1">{project.name}</span>

                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <div
                                                role="button"
                                                className="h-full rounded-sm hover:bg-muted p-0.5"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-48">
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/projects/${project.id}/sprints`);
                                            }}>
                                                <Calendar className="h-4 w-4 mr-2" />
                                                Sprints
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => handleEdit(project.id, e)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={(e) => handleDelete(project.id, e)}>
                                                <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {editingProject && (
                <ProjectModal
                    key={editingProject} // Force re-mount
                    projectId={editingProject}
                    open={!!editingProject}
                    onClose={() => setEditingProject(null)}
                />
            )}
        </>
    );
}
