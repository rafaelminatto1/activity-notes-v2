"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps, NodeResizer, Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Upload } from "lucide-react";

type ImageNodeData = Node<{
  url: string;
  onChange: (val: string) => void;
}, 'image'>;

const ImageNode = ({ data, selected }: NodeProps<ImageNodeData>) => {
  const [url, setUrl] = useState(data.url || "");

  return (
    <div
      className={cn(
        "relative min-h-[100px] min-w-[150px] bg-background border rounded-lg shadow-xl overflow-hidden transition-all duration-200",
        selected ? "ring-2 ring-primary border-primary" : "border-border"
      )}
    >
      <NodeResizer minWidth={100} minHeight={100} isVisible={selected} lineClassName="border-primary" handleClassName="h-2 w-2 bg-white border-primary border" />
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      {url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={url} alt="Canvas" className="w-full h-full object-cover pointer-events-none" />
      ) : (
        <div className="flex flex-col items-center justify-center p-6 h-full text-muted-foreground gap-2">
          <ImageIcon className="w-8 h-8 opacity-20" />
          <input 
            type="text" 
            placeholder="Cole a URL da imagem..." 
            className="text-[10px] w-full bg-muted p-1 rounded outline-none text-center"
            value={url}
            onChange={(e) => {
              const newUrl = e.target.value;
              setUrl(newUrl);
              data.onChange?.(newUrl);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default memo(ImageNode);
