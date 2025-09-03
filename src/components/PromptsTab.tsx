"use client";

import { useState } from "react";
import { Prompt } from "@modelcontextprotocol/sdk/types.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Play, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PromptsTabProps {
    prompts: Prompt[];
    onGetPrompt: (name: string, args?: Record<string, string>) => Promise<any>;
    isConnected: boolean;
}

export function PromptsTab({ prompts, onGetPrompt, isConnected }: PromptsTabProps) {
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
    const [promptArguments, setPromptArguments] = useState<Record<string, string>>({});
    const [promptResult, setPromptResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("overview");

    const toggleExpanded = (promptName: string) => {
        const newExpanded = new Set(expandedPrompts);
        if (newExpanded.has(promptName)) {
            newExpanded.delete(promptName);
        } else {
            newExpanded.add(promptName);
        }
        setExpandedPrompts(newExpanded);
    };

    const handleArgumentChange = (argName: string, value: string) => {
        setPromptArguments(prev => ({
            ...prev,
            [argName]: value
        }));
    };

    const handleGetPrompt = async (prompt: Prompt) => {
        setLoading(true);
        try {
            const result = await onGetPrompt(prompt.name, promptArguments);
            setPromptResult(result);
            setSelectedPrompt(prompt);
            setActiveTab("test");
        } catch (error) {
            console.error("Error getting prompt:", error);
        } finally {
            setLoading(false);
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

    const renderPromptCard = (prompt: Prompt) => (
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
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPrompt(prompt);
                                        setPromptArguments({});
                                        setPromptResult(null);
                                        setActiveTab("test");
                                    }}
                                    disabled={!isConnected}
                                >
                                    <Play className="h-4 w-4 mr-1" />
                                    Test
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="border-t pt-4 space-y-4">
                            <div>
                                <h5 className="font-medium mb-2">Arguments</h5>
                                {renderArgumentsSchema(prompt.arguments)}
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );

    const renderPromptsList = () => (
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
                    {prompts.map(renderPromptCard)}
                </div>
            )}
        </div>
    );

    const renderPromptTesting = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Prompt Testing</h3>
                <p className="text-sm text-muted-foreground">
                    Test prompt templates with custom arguments and view results
                </p>
            </div>

            {selectedPrompt ? (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{selectedPrompt.name}</CardTitle>
                            {selectedPrompt.description && (
                                <CardDescription>{selectedPrompt.description}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {selectedPrompt.arguments && selectedPrompt.arguments.length > 0 ? (
                                    <div>
                                        <h5 className="font-medium mb-3">Arguments</h5>
                                        <div className="space-y-3">
                                            {selectedPrompt.arguments.map((arg, index) => (
                                                <div key={index} className="space-y-2">
                                                    <Label htmlFor={`arg-${arg.name}`} className="flex items-center gap-2">
                                                        {arg.name}
                                                        {arg.required && (
                                                            <Badge variant="destructive" className="text-xs">required</Badge>
                                                        )}
                                                    </Label>
                                                    {arg.description && (
                                                        <p className="text-sm text-muted-foreground">{arg.description}</p>
                                                    )}
                                                    <Input
                                                        id={`arg-${arg.name}`}
                                                        placeholder={`Enter ${arg.name}...`}
                                                        value={promptArguments[arg.name] || ""}
                                                        onChange={(e) => handleArgumentChange(arg.name, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">This prompt requires no arguments.</p>
                                )}

                                <div className="pt-4 border-t">
                                    <Button
                                        onClick={() => handleGetPrompt(selectedPrompt)}
                                        disabled={!isConnected || loading}
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        {loading ? "Getting Prompt..." : "Get Prompt"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {promptResult && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Prompt Result</CardTitle>
                                <CardDescription>Generated content from the prompt template</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                                    {JSON.stringify(promptResult, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-medium mb-2">Select a Prompt</h4>
                        <p className="text-muted-foreground text-center max-w-md">
                            Choose a prompt from the overview tab to test its functionality
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">
                    <FileText className="w-4 h-4 mr-2" />
                    Overview
                </TabsTrigger>
                <TabsTrigger value="test">
                    <Play className="w-4 h-4 mr-2" />
                    Test Prompt
                </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
                {renderPromptsList()}
            </TabsContent>

            <TabsContent value="test" className="mt-6">
                {renderPromptTesting()}
            </TabsContent>
        </Tabs>
    );
}

