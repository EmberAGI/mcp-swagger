"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Activity, Send, Code, History, FileText } from "lucide-react";
import { Tool, Resource, Prompt } from "@modelcontextprotocol/sdk/types.js";

interface PlaygroundTabProps {
    tools: Tool[];
    resources: Resource[];
    prompts: Prompt[];
    onCallTool: (name: string, args: Record<string, unknown>) => Promise<any>;
    onReadResource: (uri: string) => Promise<any>;
    onGetPrompt: (name: string, args?: Record<string, string>) => Promise<any>;
    onMakeRequest: (request: any, schema: any) => Promise<any>;
    isConnected: boolean;
}

interface RequestHistory {
    id: string;
    timestamp: Date;
    type: "tool" | "resource" | "prompt" | "custom";
    request: any;
    response: any;
    error?: string;
}

export function PlaygroundTab({
    tools,
    resources,
    prompts,
    onCallTool,
    onReadResource,
    onGetPrompt,
    onMakeRequest,
    isConnected
}: PlaygroundTabProps) {
    const [activeTab, setActiveTab] = useState("custom");
    const [selectedTool, setSelectedTool] = useState<string>("");
    const [selectedResource, setSelectedResource] = useState<string>("");
    const [selectedPrompt, setSelectedPrompt] = useState<string>("");
    const [toolArgs, setToolArgs] = useState<Record<string, string>>({});
    const [promptArgs, setPromptArgs] = useState<Record<string, string>>({});
    const [customRequest, setCustomRequest] = useState("{\n  \"method\": \"\",\n  \"params\": {}\n}");
    const [requestHistory, setRequestHistory] = useState<RequestHistory[]>([]);
    const [loading, setLoading] = useState(false);

    const addToHistory = (
        type: RequestHistory["type"],
        request: any,
        response: any,
        error?: string
    ) => {
        const historyItem: RequestHistory = {
            id: Date.now().toString(),
            timestamp: new Date(),
            type,
            request,
            response,
            error
        };
        setRequestHistory(prev => [historyItem, ...prev].slice(0, 50)); // Keep last 50 requests
    };

    const handleToolCall = async () => {
        if (!selectedTool) return;

        setLoading(true);
        try {
            const tool = tools.find(t => t.name === selectedTool);
            const args = Object.fromEntries(
                Object.entries(toolArgs).map(([key, value]) => [
                    key,
                    (() => {
                        try {
                            return JSON.parse(value);
                        } catch {
                            return value;
                        }
                    })()
                ])
            );

            const response = await onCallTool(selectedTool, args);
            addToHistory("tool", { tool: selectedTool, arguments: args }, response);
        } catch (error) {
            addToHistory("tool", { tool: selectedTool, arguments: toolArgs }, null, error instanceof Error ? error.message : String(error));
        } finally {
            setLoading(false);
        }
    };

    const handleResourceRead = async () => {
        if (!selectedResource) return;

        setLoading(true);
        try {
            const response = await onReadResource(selectedResource);
            addToHistory("resource", { uri: selectedResource }, response);
        } catch (error) {
            addToHistory("resource", { uri: selectedResource }, null, error instanceof Error ? error.message : String(error));
        } finally {
            setLoading(false);
        }
    };

    const handlePromptGet = async () => {
        if (!selectedPrompt) return;

        setLoading(true);
        try {
            const response = await onGetPrompt(selectedPrompt, promptArgs);
            addToHistory("prompt", { name: selectedPrompt, arguments: promptArgs }, response);
        } catch (error) {
            addToHistory("prompt", { name: selectedPrompt, arguments: promptArgs }, null, error instanceof Error ? error.message : String(error));
        } finally {
            setLoading(false);
        }
    };

    const handleCustomRequest = async () => {
        setLoading(true);
        try {
            const request = JSON.parse(customRequest);
            const response = await onMakeRequest(request, {} as any);
            addToHistory("custom", request, response);
        } catch (error) {
            let request;
            try {
                request = JSON.parse(customRequest);
            } catch {
                request = { error: "Invalid JSON" };
            }
            addToHistory("custom", request, null, error instanceof Error ? error.message : String(error));
        } finally {
            setLoading(false);
        }
    };

    const getToolArguments = (toolName: string) => {
        const tool = tools.find(t => t.name === toolName);
        if (!tool?.inputSchema?.properties) return [];
        return Object.entries(tool.inputSchema.properties).map(([name, schema]: [string, any]) => ({
            name,
            ...schema,
            required: tool.inputSchema.required?.includes(name) || false
        }));
    };

    const getPromptArguments = (promptName: string) => {
        const prompt = prompts.find(p => p.name === promptName);
        return prompt?.arguments || [];
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Interactive Playground</h3>
                <p className="text-sm text-muted-foreground">
                    Test and experiment with MCP server capabilities in real-time
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="tools">
                        <Code className="w-4 h-4 mr-2" />
                        Tools
                    </TabsTrigger>
                    <TabsTrigger value="resources">
                        <FileText className="w-4 h-4 mr-2" />
                        Resources
                    </TabsTrigger>
                    <TabsTrigger value="prompts">
                        <Activity className="w-4 h-4 mr-2" />
                        Prompts
                    </TabsTrigger>
                    <TabsTrigger value="custom">
                        <Send className="w-4 h-4 mr-2" />
                        Custom
                    </TabsTrigger>
                </TabsList>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    <div className="lg:col-span-2 space-y-4">
                        <TabsContent value="tools" className="mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tool Execution</CardTitle>
                                    <CardDescription>Select and execute tools with custom parameters</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="tool-select">Tool</Label>
                                        <Select value={selectedTool} onValueChange={setSelectedTool}>
                                            <SelectTrigger id="tool-select">
                                                <SelectValue placeholder="Select a tool..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tools.map(tool => (
                                                    <SelectItem key={tool.name} value={tool.name}>
                                                        {tool.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedTool && getToolArguments(selectedTool).map(arg => (
                                        <div key={arg.name}>
                                            <Label htmlFor={`tool-arg-${arg.name}`} className="flex items-center gap-2">
                                                {arg.name}
                                                {arg.required && <Badge variant="destructive" className="text-xs">required</Badge>}
                                                {arg.type && <Badge variant="outline" className="text-xs">{arg.type}</Badge>}
                                            </Label>
                                            <Input
                                                id={`tool-arg-${arg.name}`}
                                                placeholder={arg.description || `Enter ${arg.name}...`}
                                                value={toolArgs[arg.name] || ""}
                                                onChange={(e) => setToolArgs(prev => ({ ...prev, [arg.name]: e.target.value }))}
                                            />
                                            {arg.description && (
                                                <p className="text-xs text-muted-foreground mt-1">{arg.description}</p>
                                            )}
                                        </div>
                                    ))}

                                    <Button
                                        onClick={handleToolCall}
                                        disabled={!selectedTool || !isConnected || loading}
                                        className="w-full"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        {loading ? "Executing..." : "Execute Tool"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="resources" className="mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Resource Reading</CardTitle>
                                    <CardDescription>Read and explore resource content</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="resource-select">Resource</Label>
                                        <Select value={selectedResource} onValueChange={setSelectedResource}>
                                            <SelectTrigger id="resource-select">
                                                <SelectValue placeholder="Select a resource..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {resources.map(resource => (
                                                    <SelectItem key={resource.uri} value={resource.uri}>
                                                        {resource.name || resource.uri}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        onClick={handleResourceRead}
                                        disabled={!selectedResource || !isConnected || loading}
                                        className="w-full"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        {loading ? "Reading..." : "Read Resource"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="prompts" className="mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Prompt Testing</CardTitle>
                                    <CardDescription>Test prompt templates with custom arguments</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="prompt-select">Prompt</Label>
                                        <Select value={selectedPrompt} onValueChange={setSelectedPrompt}>
                                            <SelectTrigger id="prompt-select">
                                                <SelectValue placeholder="Select a prompt..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {prompts.map(prompt => (
                                                    <SelectItem key={prompt.name} value={prompt.name}>
                                                        {prompt.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedPrompt && getPromptArguments(selectedPrompt).map(arg => (
                                        <div key={arg.name}>
                                            <Label htmlFor={`prompt-arg-${arg.name}`} className="flex items-center gap-2">
                                                {arg.name}
                                                {arg.required && <Badge variant="destructive" className="text-xs">required</Badge>}
                                            </Label>
                                            <Input
                                                id={`prompt-arg-${arg.name}`}
                                                placeholder={arg.description || `Enter ${arg.name}...`}
                                                value={promptArgs[arg.name] || ""}
                                                onChange={(e) => setPromptArgs(prev => ({ ...prev, [arg.name]: e.target.value }))}
                                            />
                                            {arg.description && (
                                                <p className="text-xs text-muted-foreground mt-1">{arg.description}</p>
                                            )}
                                        </div>
                                    ))}

                                    <Button
                                        onClick={handlePromptGet}
                                        disabled={!selectedPrompt || !isConnected || loading}
                                        className="w-full"
                                    >
                                        <Activity className="w-4 h-4 mr-2" />
                                        {loading ? "Testing..." : "Test Prompt"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="custom" className="mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Custom Request</CardTitle>
                                    <CardDescription>Send raw MCP requests for advanced testing</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="custom-request">JSON Request</Label>
                                        <Textarea
                                            id="custom-request"
                                            rows={10}
                                            className="font-mono text-sm"
                                            value={customRequest}
                                            onChange={(e) => setCustomRequest(e.target.value)}
                                            placeholder="Enter your MCP request as JSON..."
                                        />
                                    </div>

                                    <Button
                                        onClick={handleCustomRequest}
                                        disabled={!isConnected || loading}
                                        className="w-full"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        {loading ? "Sending..." : "Send Request"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>

                    <div className="space-y-4">
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Request History
                                </CardTitle>
                                <CardDescription>Recent requests and responses</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                                {requestHistory.length === 0 ? (
                                    <p className="text-muted-foreground text-sm text-center py-4">
                                        No requests yet. Start testing to see history.
                                    </p>
                                ) : (
                                    requestHistory.map(item => (
                                        <div key={item.id} className="border rounded-lg p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Badge variant={item.error ? "destructive" : "success"}>
                                                    {item.type}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {item.timestamp.toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-medium">Request:</p>
                                                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                                    {JSON.stringify(item.request, null, 2)}
                                                </pre>
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-medium">
                                                    {item.error ? "Error:" : "Response:"}
                                                </p>
                                                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                                    {item.error || JSON.stringify(item.response, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}

