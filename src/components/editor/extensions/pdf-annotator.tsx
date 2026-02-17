import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import * as fabric from "fabric"; // Fabric v6
import { 
  ChevronLeft, 
  ChevronRight, 
  Pen, 
  Type, 
  Square, 
  Circle as CircleIcon, 
  Move, 
  Trash2, 
  Save, 
  Loader2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface AnnotationData {
  objects: Record<string, unknown>[];
  version: string;
}

interface AnnotatorProps {
  node: {
    attrs: {
      src: string;
      type: "pdf" | "image";
      title?: string;
      page?: number;
      annotations?: Record<number, AnnotationData>; // Page number -> Fabric JSON
      width?: string | number;
      height?: string | number;
    };
  };
  updateAttributes: (attrs: any) => void;
  deleteNode: () => void;
}

const COLORS = ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00"];

function PdfAnnotatorComponent({ node, updateAttributes }: AnnotatorProps) {
  const { src, type, page: initialPage = 1, annotations = {} } = node.attrs;
  
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [scale, setScale] = useState(1);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "pen" | "text" | "rect" | "circle">("select");
  const [color, setColor] = useState("#FF0000");
  const [containerWidth, setContainerWidth] = useState(800);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      setContainerWidth(width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
      selection: true,
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Load annotations when page changes or canvas is ready
  useEffect(() => {
    if (!canvas) return;

    const loadPageAnnotations = async () => {
      // Clear canvas but keep background if image
      canvas.clear();
      
      const pageData = annotations[currentPage];
      if (pageData) {
        await canvas.loadFromJSON(pageData);
      }
      
      // Setup drawing brush
      const brush = new fabric.PencilBrush(canvas);
      brush.color = color;
      brush.width = 2;
      canvas.freeDrawingBrush = brush;
      
      canvas.requestRenderAll();
    };

    loadPageAnnotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, canvas]);

  // Update canvas mode based on tool
  useEffect(() => {
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === "pen";
    canvas.selection = activeTool === "select";

    // Reset cursor
    canvas.defaultCursor = "default";
    canvas.hoverCursor = "move";

    if (activeTool === "text") {
      canvas.defaultCursor = "text";
    }
  }, [activeTool, canvas]);

  // Update brush settings
  useEffect(() => {
    if (!canvas || !canvas.freeDrawingBrush) return;
    canvas.freeDrawingBrush.color = color;
  }, [color, canvas]);

  const saveAnnotations = useCallback(() => {
    if (!canvas) return;
    const json = canvas.toJSON();
    const newAnnotations = {
      ...annotations,
      [currentPage]: json
    };
    updateAttributes({ annotations: newAnnotations, page: currentPage });
    toast.success("Anotações salvas!");
  }, [canvas, annotations, currentPage, updateAttributes]);

  // PDF Load Success
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Handle adding objects
  const addText = () => {
    if (!canvas) return;
    const text = new fabric.IText("Texto", {
      left: 100,
      top: 100,
      fontFamily: "Arial",
      fill: color,
      fontSize: 20,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    setActiveTool("select");
  };

  const addRect = () => {
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: "transparent",
      stroke: color,
      strokeWidth: 2,
      width: 100,
      height: 100,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    setActiveTool("select");
  };

  const addCircle = () => {
    if (!canvas) return;
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      fill: "transparent",
      stroke: color,
      strokeWidth: 2,
      radius: 50,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    setActiveTool("select");
  };

  const deleteSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      activeObjects.forEach((obj) => {
        canvas.remove(obj);
      });
    }
  };

  // Render logic
  return (
    <NodeViewWrapper className="my-4 relative border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-sm print:shadow-none">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-white dark:bg-gray-800 sticky top-0 z-10">
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          {type === "pdf" && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium w-12 text-center">
                {currentPage} / {numPages || "-"}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setCurrentPage(p => Math.min(numPages || 1, p + 1))}
                disabled={!numPages || currentPage >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          <div className="h-4 w-px bg-border mx-1" />
          <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs w-8 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(3, s + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant={activeTool === "select" ? "secondary" : "ghost"} size="icon" onClick={() => setActiveTool("select")} title="Selecionar">
            <Move className="h-4 w-4" />
          </Button>
          <Button variant={activeTool === "pen" ? "secondary" : "ghost"} size="icon" onClick={() => setActiveTool("pen")} title="Caneta">
            <Pen className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={addText} title="Texto">
            <Type className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={addRect} title="Retângulo">
            <Square className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={addCircle} title="Círculo">
            <CircleIcon className="h-4 w-4" />
          </Button>
          
          <div className="h-4 w-px bg-border mx-1" />
          
          <div className="flex items-center gap-1">
            {COLORS.map(c => (
              <button
                key={c}
                className={cn(
                  "w-4 h-4 rounded-full border border-gray-200",
                  color === c && "ring-2 ring-primary ring-offset-1"
                )}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          <Button variant="ghost" size="icon" onClick={deleteSelected} title="Excluir selecionado" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon" onClick={saveAnnotations} title="Salvar Anotações">
            <Save className="h-4 w-4 text-primary" />
          </Button>
        </div>
      </div>

      {/* Viewer Canvas */}
      <div 
        ref={containerRef}
        className="relative overflow-auto bg-gray-100 dark:bg-gray-900 flex justify-center min-h-[500px]"
        style={{ height: 'auto' }}
      >
        <div className="relative shadow-lg m-4" style={{ width: containerWidth * scale }}>
          {type === "pdf" ? (
            <Document
              file={src}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>}
              className="pdf-document"
            >
              <Page 
                pageNumber={currentPage} 
                scale={scale} 
                width={containerWidth}
                className="pdf-page"
                renderAnnotationLayer={false}
                renderTextLayer={false}
                onRenderSuccess={() => {
                  // Resize fabric canvas to match
                  if (canvas && containerRef.current) {
                    const el = document.querySelector('.react-pdf__Page__canvas');
                    if (el) {
                      const { width, height } = el.getBoundingClientRect();
                      canvas.setDimensions({ width, height });
                    }
                  }
                }}
              />
            </Document>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={src} 
              alt="Annotatable" 
              className="block"
              style={{ width: '100%', height: 'auto' }}
              onLoad={(e) => {
                if (canvas) {
                  const target = e.target as HTMLImageElement;
                  canvas.setDimensions({ width: target.width, height: target.height });
                }
              }}
            />
          )}
          
          <div className="absolute inset-0 z-10 pointer-events-auto">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const PdfAnnotatorExtension = Node.create({
  name: "pdfAnnotator",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      type: {
        default: "pdf",
      },
      title: {
        default: null,
      },
      page: {
        default: 1,
      },
      annotations: {
        default: {},
      },
      width: {
        default: "100%",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "pdf-annotator",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["pdf-annotator", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PdfAnnotatorComponent);
  },
});
