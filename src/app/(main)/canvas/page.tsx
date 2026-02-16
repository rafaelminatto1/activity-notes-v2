"use client";

import { CanvasBoard } from "@/components/canvas/board";
import { FadeIn, SlideAndFade } from "@/components/ui/motion-primitives";

export default function CanvasPage() {
    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div className="flex items-center justify-between space-y-2">
                <SlideAndFade>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Infinity Canvas</h2>
                        <p className="text-muted-foreground">
                            Visualize your ideas and connect your notes spatially.
                        </p>
                    </div>
                </SlideAndFade>
            </div>
            <FadeIn delay={0.2} className="flex-1">
                <CanvasBoard />
            </FadeIn>
        </div>
    );
}
