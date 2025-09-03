"use client";

import { useState } from "react";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Play, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ToolsTabProps {
    tools: Tool[];
    onCallTool: (name: string, args: Record<string, unknown>) => Promise<any>;
    isConnected: boolean;
}

export function ToolsTab({ tools, onCallTool, isConnected }: ToolsTabProps) {
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<string>("overview");

    const toggleExpanded = (toolName: string) => {
        const newExpanded = new Set(expandedTools);
        if (newExpanded.has(toolName)) {
            newExpanded.delete(toolName);
        } else {
            newExpanded.add(toolName);
        }
        setExpandedTools(newExpanded);
    };

    const renderToolSchema = (schema: any) => {
        if (!schema) return <p className="text-muted-foreground text-sm">No schema provided</p>;

        return (
            <div className="space-y-2">
                {schema.type && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Type:</span>
                        <Badge variant="outline">{schema.type}</Badge>
                    </div>
                )}
                {schema.properties && (
                    <div className="space-y-2">
                        <h5 className="text-sm font-medium">Parameters:</h5>
                        <div className="space-y-2 pl-4">
                            {Object.entries(schema.properties as Record<string, any>).map(([key, prop]: [string, any]) => (
                                <div key={key} className="border rounded-lg p-3 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <code className="text-sm bg-muted px-2 py-1 rounded">{key}</code>
                                        {prop.type && <Badge variant="secondary" className="text-xs">{prop.type}</Badge>}
                                        {schema.required?.includes(key) && (
                                            <Badge variant="destructive" className="text-xs">required</Badge>
                                        )}
                                    </div>
                                    {prop.description && (
                                        <p className="text-sm text-muted-foreground">{prop.description}</p>
                                    )}
                                    {prop.enum && (
                                        <div className="text-sm">
                                            <span className="font-medium">Allowed values:</span>{" "}
                                            {prop.enum.map((val: any, idx: number) => (
                                                <span key={idx}>
                                                    <code className="bg-muted px-1 rounded text-xs">{JSON.stringify(val)}</code>
                                                    {idx < prop.enum.length - 1 && ", "}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {prop.default !== undefined && (
                                        <div className="text-sm">
                                            <span className="font-medium">Default:</span>{" "}
                                            <code className="bg-muted px-1 rounded text-xs">{JSON.stringify(prop.default)}</code>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderToolsList = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Available Tools</h3>
                    <p className="text-sm text-muted-foreground">
                        {tools.length} tool{tools.length !== 1 ? "s" : ""} available
                    </p>
                </div>
            </div>

            {tools.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <Code className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-medium mb-2">No Tools Available</h4>
                        <p className="text-muted-foreground text-center max-w-md">
                            {isConnected
                                ? "This server doesn't provide any tools, or tools are not supported."
                                : "Connect to an MCP server to view available tools."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {tools.map((tool) => (
                        <Card key={tool.name} className="overflow-hidden">
                            <Collapsible
                                open={expandedTools.has(tool.name)}
                                onOpenChange={() => toggleExpanded(tool.name)}
                            >
                                <CollapsibleTrigger asChild>
                                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {expandedTools.has(tool.name) ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                                <div>
                                                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                                                    {tool.description && (
                                                        <CardDescription className="mt-1">
                                                            {tool.description}
                                                        </CardDescription>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTool(tool);
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
                                                <h5 className="font-medium mb-2">Input Schema</h5>
                                                {renderToolSchema(tool.inputSchema)}
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

    const renderToolTesting = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Tool Testing</h3>
                <p className="text-sm text-muted-foreground">
                    Test tool execution with custom parameters and view responses
                </p>
            </div>

            {selectedTool ? (
                <Card>
                    <CardHeader>
                        <CardTitle>{selectedTool.name}</CardTitle>
                        {selectedTool.description && (
                            <CardDescription>{selectedTool.description}</CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h5 className="font-medium mb-2">Input Schema</h5>
                                {renderToolSchema(selectedTool.inputSchema)}
                            </div>

                            <div className="pt-4 border-t">
                                <Button disabled={!isConnected}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Execute Tool
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-medium mb-2">Select a Tool</h4>
                        <p className="text-muted-foreground text-center max-w-md">
                            Choose a tool from the overview tab to test its functionality
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
                    Test Tool
                </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
                {renderToolsList()}
            </TabsContent>

            <TabsContent value="test" className="mt-6">
                {renderToolTesting()}
            </TabsContent>
        </Tabs>
    );
}
