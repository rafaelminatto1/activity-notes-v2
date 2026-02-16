"use client";

import { motion, HTMLMotionProps, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface FadeInProps extends HTMLMotionProps<"div"> {
    delay?: number;
    duration?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
    fullWidth?: boolean;
}

export function FadeIn({
    children,
    className,
    delay = 0,
    duration = 0.5,
    direction = "up",
    fullWidth = false,
    ...props
}: FadeInProps) {
    const directions = {
        up: { y: 20 },
        down: { y: -20 },
        left: { x: 20 },
        right: { x: -20 },
        none: {},
    };

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction] }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, ...directions[direction] }}
            transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }}
            className={cn(fullWidth && "w-full", className)}
            {...props}
        >
            {children}
        </motion.div>
    );
}

interface ScalePressProps extends HTMLMotionProps<"div"> {
    scale?: number;
}

export function ScalePress({
    children,
    className,
    scale = 0.95,
    ...props
}: ScalePressProps) {
    return (
        <motion.div
            whileTap={{ scale }}
            className={cn("cursor-pointer", className)}
            {...props}
        >
            {children}
        </motion.div>
    );
}

interface SlideAndFadeProps extends HTMLMotionProps<"div"> {
    index?: number;
    staggerDelay?: number;
}

export function SlideAndFade({
    children,
    className,
    index = 0,
    staggerDelay = 0.05,
    ...props
}: SlideAndFadeProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: index * staggerDelay,
                duration: 0.4,
                ease: "easeOut",
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export const Motion = {
    div: motion.div,
    span: motion.span,
    button: motion.button,
    a: motion.a,
    list: motion.ul,
    item: motion.li,
};

export { AnimatePresence };
