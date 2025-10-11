"use client";

import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import ConversationalPromptInput from './ConversationalPromptInput';
import { PromptTemplate } from '@/config/prompts';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (prompt: string, template?: PromptTemplate) => void;
    onCallTool?: (name: string, args: Record<string, unknown>) => Promise<any>;
    onGetPrompt?: (name: string, args?: Record<string, string>) => Promise<any>;
    handleCompletion?: (
        ref: { type: "ref/prompt"; name: string },
        argName: string,
        value: string,
        context?: Record<string, string>,
        signal?: AbortSignal
    ) => Promise<string[]>;
    completionsSupported?: boolean;
    isConnected?: boolean;
}

export function CommandPalette({
    isOpen,
    onClose,
    onSubmit,
    onCallTool,
    onGetPrompt,
    handleCompletion,
    completionsSupported = false,
    isConnected = false
}: CommandPaletteProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus the input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            // Small delay to ensure the modal is fully rendered
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    const handleSubmit = (prompt: string, template?: PromptTemplate) => {
        onSubmit(prompt, template);
        onClose(); // Close the modal after submission
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-2xl w-full p-0 border-0 bg-transparent shadow-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%] [&>button]:hidden"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <div className="relative">
                    {/* Backdrop blur effect with animation */}
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-2xl animate-in fade-in-0 duration-300" />

                    {/* Main content with cool animations */}
                    <div className="relative bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl p-2 animate-in slide-in-from-top-2 fade-in-0 zoom-in-95 duration-300">
                        {/* Input */}
                        <ConversationalPromptInput
                            ref={inputRef}
                            onSubmit={handleSubmit}
                            placeholder="Ask something or type a command... (try: swap, long, supply, borrow)"
                            className="w-full"
                            onCallTool={onCallTool}
                            onGetPrompt={onGetPrompt}
                            handleCompletion={handleCompletion}
                            completionsSupported={completionsSupported}
                            isConnected={isConnected}
                        />

                        {/* Quick tips with staggered animation */}
                        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-2 animate-in slide-in-from-bottom-2 fade-in-0 delay-150">
                            <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs transition-colors hover:bg-muted/80">⌘K</kbd>
                                <span>to open</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs transition-colors hover:bg-muted/80">Esc</kbd>
                                <span>to close</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs transition-colors hover:bg-muted/80">Tab</kbd>
                                <span>to complete</span>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
