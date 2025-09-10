"use client";

import { useEffect, useRef, useState } from "react";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Code, Play, FileText, ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import JsonView from "./JsonView";

interface ToolsTabProps {
    tools: Tool[];
    onCallTool: (name: string, args: Record<string, unknown>) => Promise<any>;
    isConnected: boolean;
}

export function ToolsTab({ tools, onCallTool, isConnected }: ToolsTabProps) {
    const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
    const [showDocs, setShowDocs] = useState<boolean>(false);
    const [toolArgumentsByName, setToolArgumentsByName] = useState<Record<string, Record<string, any>>>({});
    const [toolResultsByName, setToolResultsByName] = useState<Record<string, any>>({});
    const [toolErrorsByName, setToolErrorsByName] = useState<Record<string, string | null>>({});
    const [loadingTools, setLoadingTools] = useState<Record<string, boolean>>({});

    const toggleExpanded = (toolName: string) => {
        const newExpanded = new Set(expandedTools);
        if (newExpanded.has(toolName)) {
            newExpanded.delete(toolName);
        } else {
            newExpanded.add(toolName);
        }
        setExpandedTools(newExpanded);
    };

    const handleArgumentChange = (toolName: string, argName: string, value: string) => {
        setToolArgumentsByName(prev => ({
            ...prev,
            [toolName]: {
                ...(prev[toolName] || {}),
                [argName]: value
            }
        }));
    };

    const handleExecuteTool = async (tool: Tool) => {
        const toolName = tool.name;
        setLoadingTools(prev => ({ ...prev, [toolName]: true }));
        setToolErrorsByName(prev => ({ ...prev, [toolName]: null }));
        setToolResultsByName(prev => ({ ...prev, [toolName]: null }));

        try {
            const parsedArguments: Record<string, any> = {};
            const schema = parseJsonSchema(tool.inputSchema);
            const toolArgs = toolArgumentsByName[toolName] || {};

            for (const param of schema) {
                const value = toolArgs[param.name];
                if (value === undefined || value === '') continue;

                try {
                    if (param.type === 'boolean') {
                        parsedArguments[param.name] = value === 'true' || value === true;
                    } else if (param.type === 'number' || param.type === 'integer') {
                        parsedArguments[param.name] = Number(value);
                    } else if (param.type === 'object' || param.type === 'array') {
                        parsedArguments[param.name] = typeof value === 'string' ? JSON.parse(value) : value;
                    } else {
                        parsedArguments[param.name] = value;
                    }
                } catch (e) {
                    throw new Error(`Invalid ${param.type} value for ${param.name}: ${e instanceof Error ? e.message : 'Invalid format'}`);
                }
            }

            const result = await onCallTool(toolName, parsedArguments);
            setToolResultsByName(prev => ({ ...prev, [toolName]: result }));
        } catch (err) {
            setToolErrorsByName(prev => ({ ...prev, [toolName]: err instanceof Error ? err.message : 'An error occurred while executing the tool' }));
        } finally {
            setLoadingTools(prev => ({ ...prev, [toolName]: false }));
        }
    };

    // Ensure interactive view is not blank once on initial load: auto-expand the first tool
    const hasAutoExpandedRef = useRef(false);
    useEffect(() => {
        if (!showDocs && tools.length > 0 && !hasAutoExpandedRef.current) {
            setExpandedTools(new Set([tools[0].name]));
            hasAutoExpandedRef.current = true;
        }
    }, [tools, showDocs]);

    const parseJsonSchema = (schema: any): any[] => {
        if (!schema || typeof schema !== 'object') return [];

        // Handle different schema formats
        if (schema.type === 'object' && schema.properties) {
            return Object.entries(schema.properties).map(([name, prop]: [string, any]) => ({
                name,
                type: prop.type || 'string',
                description: prop.description,
                required: schema.required?.includes(name) || false,
                enum: prop.enum,
                default: prop.default
            }));
        }

        // If it's a direct properties object
        if (schema.properties) {
            return parseJsonSchema({ type: 'object', ...schema });
        }

        return [];
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

    const renderDocsList = () => (
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
                                onOpenChange={(open) => {
                                    toggleExpanded(tool.name);
                                    if (open) {
                                        setSelectedTool(tool);
                                        setToolArguments({});
                                        setToolResult(null);
                                        setError(null);
                                        setShowDocs(false);
                                    }
                                }}
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
                                            <div className="flex items-center gap-2" />
                                        </div>
                                    </CardHeader>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <CardContent className="pt-0">
                                        <div className="border-t pt-4 space-y-4">
                                            <div>
                                                <h5 className="font-medium mb-2">Parameters</h5>
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

    const renderInteractiveList = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowDocs(true)}>Docs</Button>
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
                    {tools.map((tool) => {
                        const toolName = tool.name;
                        const toolArgs = toolArgumentsByName[toolName] || {};
                        const isLoading = !!loadingTools[toolName];
                        const error = toolErrorsByName[toolName];
                        const result = toolResultsByName[toolName];

                        return (
                            <Card key={toolName} className="overflow-hidden">
                                <Collapsible
                                    open={expandedTools.has(toolName)}
                                    onOpenChange={(open) => {
                                        const next = new Set(expandedTools);
                                        if (open) next.add(toolName); else next.delete(toolName);
                                        setExpandedTools(next);
                                    }}
                                >
                                    <CollapsibleTrigger asChild>
                                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {expandedTools.has(toolName) ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                    <div>
                                                        <CardTitle className="text-lg">{toolName}</CardTitle>
                                                        {tool.description && (
                                                            <CardDescription className="mt-1">
                                                                {tool.description}
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
                                                {tool.inputSchema && (
                                                    <div>
                                                        <h5 className="font-medium mb-3">Parameters</h5>
                                                        <div className="space-y-3">
                                                            {parseJsonSchema(tool.inputSchema).map((param, index) => (
                                                                <div key={index} className="space-y-2">
                                                                    <Label htmlFor={`param-${toolName}-${param.name}`} className="flex items-center gap-2">
                                                                        {param.name}
                                                                        {param.required && (
                                                                            <Badge variant="destructive" className="text-xs">required</Badge>
                                                                        )}
                                                                        {param.type && <Badge variant="outline" className="text-xs">{param.type}</Badge>}
                                                                    </Label>
                                                                    {param.description && (
                                                                        <p className="text-sm text-muted-foreground">{param.description}</p>
                                                                    )}
                                                                    {param.type === 'string' && param.enum ? (
                                                                        <select
                                                                            id={`param-${toolName}-${param.name}`}
                                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                            value={toolArgs[param.name] || ''}
                                                                            onChange={(e) => handleArgumentChange(toolName, param.name, e.target.value)}
                                                                        >
                                                                            <option value="">Select {param.name}...</option>
                                                                            {param.enum.map((option: string) => (
                                                                                <option key={option} value={option}>
                                                                                    {option}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    ) : param.type === 'boolean' ? (
                                                                        <div className="flex items-center space-x-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                id={`param-${toolName}-${param.name}`}
                                                                                checked={toolArgs[param.name] || false}
                                                                                onChange={(e) => handleArgumentChange(toolName, param.name, e.target.checked ? 'true' : 'false')}
                                                                                className="h-4 w-4 rounded border-gray-300"
                                                                            />
                                                                        </div>
                                                                    ) : param.type === 'object' || param.type === 'array' ? (
                                                                        <Textarea
                                                                            id={`param-${toolName}-${param.name}`}
                                                                            placeholder={`Enter JSON for ${param.name}...`}
                                                                            value={toolArgs[param.name] || ''}
                                                                            onChange={(e) => handleArgumentChange(toolName, param.name, e.target.value)}
                                                                            className="min-h-[100px] font-mono text-sm"
                                                                        />
                                                                    ) : (
                                                                        <Input
                                                                            id={`param-${toolName}-${param.name}`}
                                                                            type={param.type === 'number' || param.type === 'integer' ? 'number' : 'text'}
                                                                            placeholder={`Enter ${param.name}...`}
                                                                            value={toolArgs[param.name] || ''}
                                                                            onChange={(e) => handleArgumentChange(toolName, param.name, e.target.value)}
                                                                        />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="pt-4 border-t">
                                                    <Button
                                                        onClick={() => handleExecuteTool(tool)}
                                                        disabled={!isConnected || isLoading}
                                                    >
                                                        {isLoading ? (
                                                            <>Loading...</>
                                                        ) : (
                                                            <>
                                                                <Play className="h-4 w-4 mr-2" />
                                                                Execute Tool
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                {error && (
                                                    <Alert variant="destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <AlertDescription>{error}</AlertDescription>
                                                    </Alert>
                                                )}

                                                {result && (
                                                    <Card>
                                                        <CardHeader>
                                                            <CardTitle className="flex items-center gap-2">
                                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                                Result
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <JsonView data={result} />
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </div>
                                        </CardContent>
                                    </CollapsibleContent>
                                </Collapsible>
                            </Card>
                        );
                    })}
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

