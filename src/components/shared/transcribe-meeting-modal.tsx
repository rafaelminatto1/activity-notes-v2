"use client";

import React, { useState, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  Upload, 
  FileAudio, 
  Loader2, 
  CheckCircle, 
  FileText,
  Plus,
  Users,
  Target,
  Sparkles
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { uploadFile } from "@/lib/firebase/storage";
import { createDocument } from "@/lib/firebase/firestore";
import { createTask } from "@/lib/firebase/tasks";
import { transcribeMeeting, TranscriptionResponse } from "@/lib/ai/speech";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface TranscribeMeetingModalProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
}

type Step = "upload" | "processing" | "result";

export function TranscribeMeetingModal({ open, onClose, projectId }: TranscribeMeetingModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TranscriptionResponse | null>(null);
  const [newDocId, setNewDocId] = useState<string | null>(null);
  const [createdTasks, setCreatedTasks] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 20 * 1024 * 1024) { // 20MB limit for Gemini audio
        toast.error("Arquivo muito grande. O limite é 20MB.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const startTranscription = async () => {
    if (!file || !user) return;

    setStep("processing");
    setIsProcessing(true);
    setUploadProgress(10);

    try {
      // 1. Upload to Storage
      const audioUrl = await uploadFile(file, user.uid, "meetings", (p) => {
        setUploadProgress(10 + (p * 0.4)); // 10% to 50% for upload
      });

      setUploadProgress(60);

      // 2. Create placeholder document
      const docId = await createDocument(user.uid, {
        title: `Reunião: ${file.name.split(".")[0]}`,
        icon: "🎙️",
        projectId: projectId || null,
      });
      setNewDocId(docId);

      setUploadProgress(70);

      // 3. Call transcription function
      const transcriptionData = await transcribeMeeting(audioUrl, docId);
      
      setUploadProgress(100);
      setResult(transcriptionData);
      setStep("result");
      toast.success("Transcrição concluída!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar reunião.");
      setStep("upload");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTask = async (actionItem: string) => {
    if (!user) return;
    try {
      await createTask(user.uid, {
        title: actionItem,
        projectId: projectId || null,
        documentId: newDocId || undefined,
        status: "todo",
        priority: "medium"
      });
      setCreatedTasks(prev => new Set(prev).add(actionItem));
      toast.success("Tarefa criada!");
    } catch {
      toast.error("Erro ao criar tarefa.");
    }
  };

  const resetModal = () => {
    setStep("upload");
    setFile(null);
    setResult(null);
    setNewDocId(null);
    setUploadProgress(0);
    setCreatedTasks(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isProcessing && resetModal()}>
      <DialogContent className={cn(
        "transition-all duration-300",
        step === "result" ? "max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" : "max-w-md"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-emerald-600">
            <Mic className="h-6 w-6" />
            Anotador de IA
          </DialogTitle>
          <DialogDescription>
            Transforme suas reuniões em documentos estruturados com resumo e planos de ação.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-8"
            >
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all",
                  file ? "border-emerald-500 bg-emerald-50" : "border-muted-foreground/20 hover:border-emerald-400 hover:bg-muted/50"
                )}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="audio/*,video/*"
                />
                {file ? (
                  <>
                    <FileAudio className="h-12 w-12 text-emerald-500 mb-4" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <div className="bg-emerald-100 p-4 rounded-full mb-4">
                      <Upload className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Clique ou arraste o áudio</p>
                    <p className="text-xs text-muted-foreground mt-2">MP3, WAV, MP4, WEBM (Máx 20MB)</p>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center"
            >
              <div className="relative mb-8">
                <Loader2 className="h-16 w-16 text-emerald-500 animate-spin" />
                <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold mb-2">Processando Reunião...</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                A IA está transcrevendo o áudio e gerando os pontos principais. Isso pode levar um momento.
              </p>
              <div className="w-full max-w-xs space-y-2">
                <Progress value={uploadProgress} className="h-2 bg-emerald-100" />
                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
                  {uploadProgress < 50 ? "Fazendo upload..." : uploadProgress < 80 ? "Analisando áudio..." : "Finalizando..."}
                </p>
              </div>
            </motion.div>
          )}

          {step === "result" && result && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-6 py-4"
            >
              {/* Left Column: Summary & Info */}
              <div className="space-y-6 overflow-y-auto pr-2">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    <FileText className="h-4 w-4" /> Resumo Executivo
                  </h4>
                  <p className="text-sm bg-muted/30 p-4 rounded-lg leading-relaxed border border-muted-foreground/10">
                    {result.summary}
                  </p>
                </div>

                {result.speakers && result.speakers.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
                      <Users className="h-4 w-4" /> Participantes Identificados
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.speakers.map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-background border rounded-md text-xs font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    <CheckCircle className="h-4 w-4" /> Transcrição Completa
                  </h4>
                  <div className="text-xs text-muted-foreground max-h-[200px] overflow-y-auto p-3 bg-muted/20 rounded-md italic">
                    {result.transcript}
                  </div>
                </div>
              </div>

              {/* Right Column: Action Items & Decisions */}
              <div className="space-y-6 overflow-y-auto pr-2">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    <Target className="h-4 w-4 text-emerald-500" /> Itens de Ação
                  </h4>
                  <div className="space-y-2">
                    {result.actionItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg group">
                        <span className="text-sm font-medium flex-1">{item}</span>
                        {createdTasks.has(item) ? (
                          <div className="bg-emerald-500 text-white p-1 rounded-full shrink-0">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCreateTask(item)}
                          >
                            <Plus className="h-3.5 w-3.5" /> Tarefa
                          </Button>
                        )}
                      </div>
                    ))}
                    {result.actionItems.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-4">Nenhum item de ação identificado.</p>
                    )}
                  </div>
                </div>

                {result.decisions && result.decisions.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3 text-blue-500">
                      Decisões Chave
                    </h4>
                    <ul className="space-y-2">
                      {result.decisions.map((d, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className={cn(
          "border-t pt-4",
          step === "result" ? "sm:justify-between" : "sm:justify-end"
        )}>
          {step === "upload" && (
            <>
              <Button variant="ghost" onClick={resetModal} disabled={isProcessing}>Cancelar</Button>
              <Button 
                onClick={startTranscription} 
                disabled={!file || isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2 shadow-lg"
              >
                Começar Análise <Plus className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {step === "result" && (
            <>
              <Button variant="ghost" onClick={resetModal}>Fechar</Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/documents/${newDocId}`)}
                >
                  Ver Documento Completo
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={resetModal}
                >
                  Concluir
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
