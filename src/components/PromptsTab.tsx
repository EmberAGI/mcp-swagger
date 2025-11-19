"use client";

import { useEffect, useRef, useState } from "react";
import { Prompt } from "@modelcontextprotocol/sdk/types.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MessageSquare, Play, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCompletionState, PromptReference } from "@/lib/hooks/useCompletionState";
import { Combobox } from "@/components/ui/combobox";

interface PromptsTabProps {
    prompts: Prompt[];
    onGetPrompt: (name: string, args?: Record<string, string>) => Promise<any>;
    isConnected: boolean;
    handleCompletion?: (
        ref: PromptReference,
        argName: string,
        value: string,
        context?: Record<string, string>,
        signal?: AbortSignal
    ) => Promise<string[]>;
    completionsSupported?: boolean;
}

export function PromptsTab({
    prompts,
    onGetPrompt,
    isConnected,
    handleCompletion,
    completionsSupported = true
}: PromptsTabProps) {
    const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
    const [argsByPrompt, setArgsByPrompt] = useState<Record<string, Record<string, string>>>({});
    const [resultByPrompt, setResultByPrompt] = useState<Record<string, any>>({});
    const [loadingByPrompt, setLoadingByPrompt] = useState<Record<string, boolean>>({});
    const [errorByPrompt, setErrorByPrompt] = useState<Record<string, string | null>>({});
    const [showDocs, setShowDocs] = useState<boolean>(false);

    const { completions, loading, errors, clearCompletions, requestCompletions, clearError } = useCompletionState(
        handleCompletion ? (ref: any, argName: string, value: string, context?: Record<string, string>, signal?: AbortSignal) =>
            handleCompletion(ref, argName, value, context, signal) : (async () => []),
        completionsSupported && !!handleCompletion
    );

    // Auto-expand first prompt to avoid blank state; only once
    const hasAutoExpandedRef = useRef(false);
    useEffect(() => {
        if (!showDocs && prompts.length > 0 && !hasAutoExpandedRef.current) {
            setExpandedPrompts(new Set([prompts[0].name]));
            hasAutoExpandedRef.current = true;
        }
    }, [prompts, showDocs]);

    const toggleExpanded = (promptName: string) => {
        const newExpanded = new Set(expandedPrompts);
        if (newExpanded.has(promptName)) {
            newExpanded.delete(promptName);
        } else {
            newExpanded.add(promptName);
        }
        setExpandedPrompts(newExpanded);
    };

    const handleArgumentChange = async (promptName: string, argName: string, value: string, isSelection: boolean = false) => {
        setArgsByPrompt(prev => ({
            ...prev,
            [promptName]: { ...(prev[promptName] || {}), [argName]: value }
        }));

        // Clear error when user starts typing
        if (errors[argName]) {
            clearError(argName);
        }

        // Request completions if supported, value is not empty, and user is typing (not selecting)
        if (handleCompletion && completionsSupported && value.trim().length > 0 && !isSelection) {
            requestCompletions(
                {
                    type: "ref/prompt",
                    name: promptName,
                },
                argName,
                value,
                argsByPrompt[promptName] || {}
            );
        }
    };

    const handleGetPrompt = async (prompt: Prompt) => {
        const name = prompt.name;
        setLoadingByPrompt(prev => ({ ...prev, [name]: true }));
        setErrorByPrompt(prev => ({ ...prev, [name]: null }));
        try {
            const result = await onGetPrompt(name, argsByPrompt[name] || {});
            setResultByPrompt(prev => ({ ...prev, [name]: result }));
            setShowDocs(false);
        } catch (error: any) {
            setErrorByPrompt(prev => ({ ...prev, [name]: error?.message || String(error) }));
        } finally {
            setLoadingByPrompt(prev => ({ ...prev, [name]: false }));
        }
    };

    const renderArgumentsSchema = (args: any[]) => {
        if (!args || args.length === 0) {
            return <p className="text-muted-foreground text-sm">No arguments required</p>;
        }

        return (
            <div className="space-y-3">
                {args.map((arg, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">{arg.name}</code>
                            {arg.required && (
                                <Badge variant="destructive" className="text-xs">required</Badge>
                            )}
                        </div>
                        {arg.description && (
                            <p className="text-sm text-muted-foreground">{arg.description}</p>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderInteractivePromptCard = (prompt: Prompt) => (
        <Card key={prompt.name} className="overflow-hidden">
            <Collapsible
                open={expandedPrompts.has(prompt.name)}
                onOpenChange={() => toggleExpanded(prompt.name)}
            >
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {expandedPrompts.has(prompt.name) ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                                <div>
                                    <CardTitle className="text-lg">{prompt.name}</CardTitle>
                                    {prompt.description && (
                                        <CardDescription className="mt-1">
                                            {prompt.description}
                                        </CardDescription>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2" />
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="border-t pt-4 space-y-4">
                            {prompt.arguments && prompt.arguments.length > 0 && (
                                <div>
                                    <h5 className="font-medium mb-3">Arguments</h5>
                                    <div className="space-y-3">
                                        {prompt.arguments.map((arg, index) => (
                                            <div key={index} className="space-y-2">
                                                <Label htmlFor={`arg-${prompt.name}-${arg.name}`} className="flex items-center gap-2">
                                                    {arg.name}
                                                    {arg.required && (
                                                        <Badge variant="destructive" className="text-xs">required</Badge>
                                                    )}
                                                </Label>
                                                {arg.description && (
                                                    <p className="text-sm text-muted-foreground">{arg.description}</p>
                                                )}
                                                {handleCompletion && completionsSupported ? (
                                                    <Combobox
                                                        id={`arg-${prompt.name}-${arg.name}`}
                                                        value={(argsByPrompt[prompt.name]?.[arg.name]) || ""}
                                                        onChange={(value) => handleArgumentChange(prompt.name, arg.name, value, true)}
                                                        onInputChange={(value) => handleArgumentChange(prompt.name, arg.name, value, false)}
                                                        options={completions[arg.name] || []}
                                                        loading={loading[arg.name] || false}
                                                        error={errors[arg.name]}
                                                        placeholder={`Enter ${arg.name}...`}
                                                        emptyMessage="No suggestions available."
                                                    />
                                                ) : (
                                                    <Input
                                                        id={`arg-${prompt.name}-${arg.name}`}
                                                        placeholder={`Enter ${arg.name}...`}
                                                        value={(argsByPrompt[prompt.name]?.[arg.name]) || ""}
                                                        onChange={(e) => handleArgumentChange(prompt.name, arg.name, e.target.value, false)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t">
                                <Button
                                    onClick={() => handleGetPrompt(prompt)}
                                    disabled={!isConnected || !!loadingByPrompt[prompt.name]}
                                >
                                    <Play className="h-4 w-4 mr-2" />
                                    {loadingByPrompt[prompt.name] ? "Getting Prompt..." : "Get Prompt"}
                                </Button>
                            </div>

                            {errorByPrompt[prompt.name] && (
                                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                                    {errorByPrompt[prompt.name]}
                                </div>
                            )}

                            {resultByPrompt[prompt.name] && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Prompt Result</CardTitle>
                                        <CardDescription>Generated content from the prompt template</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                                            {JSON.stringify(resultByPrompt[prompt.name], null, 2)}
                                        </pre>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );

    const renderDocsList = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Available Prompts</h3>
                    <p className="text-sm text-muted-foreground">
                        {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} available
                    </p>
                </div>
            </div>

            {prompts.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-medium mb-2">No Prompts Available</h4>
                        <p className="text-muted-foreground text-center max-w-md">
                            {isConnected
                                ? "This server doesn't provide any prompts, or prompts are not supported."
                                : "Connect to an MCP server to view available prompts."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {prompts.map((prompt) => (
                        <Card key={prompt.name} className="overflow-hidden">
                            <Collapsible
                                open={expandedPrompts.has(prompt.name)}
                                onOpenChange={() => toggleExpanded(prompt.name)}
                            >
                                <CollapsibleTrigger asChild>
                                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {expandedPrompts.has(prompt.name) ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                                <div>
                                                    <CardTitle className="text-lg">{prompt.name}</CardTitle>
                                                    {prompt.description && (
                                                        <CardDescription className="mt-1">
                                                            {prompt.description}
                                                        </CardDescription>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <CardContent className="pt-0">
                                        <div className="border-t pt-4 space-y-4">
                                            <div>
                                                <h5 className="font-medium mb-2">Arguments</h5>
                                                {renderArgumentsSchema(prompt.arguments || [])}
                                            </div>
                                        </div>
                                    </CardContent>
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

    const renderInteractiveList = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowDocs(true)}>Docs</Button>
            </div>

            {prompts.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-medium mb-2">No Prompts Available</h4>
                        <p className="text-muted-foreground text-center max-w-md">
                            {isConnected
                                ? "This server doesn't provide any prompts, or prompts are not supported."
                                : "Connect to an MCP server to view available prompts."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {prompts.map(renderInteractivePromptCard)}
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full">
            {showDocs ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-end">
                        <Button variant="outline" size="sm" onClick={() => setShowDocs(false)}>Back to Interactive</Button>
                    </div>
                    {renderDocsList()}
                </div>
            ) : (
                renderInteractiveList()
            )}
        </div>
    );
}

