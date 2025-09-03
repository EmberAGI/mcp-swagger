"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Bug, ChevronDown, ChevronRight, Copy, RefreshCw } from "lucide-react";
import { ConnectionState } from "@/lib/types/mcp";

interface DebugPanelProps {
    connectionState: ConnectionState;
    onTestProxy: (url: string) => void;
}

export function DebugPanel({ connectionState, onTestProxy }: DebugPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [proxyTestUrl, setProxyTestUrl] = useState("https://httpbin.org/stream/3");
    const [proxyTestResult, setProxyTestResult] = useState<string>("");

    const handleTestProxy = async () => {
        setProxyTestResult("Testing proxy...");
        try {
            const response = await fetch(`/api/mcp-sse?url=${encodeURIComponent(proxyTestUrl)}`);
            if (response.ok) {
                const reader = response.body?.getReader();
                if (reader) {
                    const { value } = await reader.read();
                    const text = new TextDecoder().decode(value);
                    setProxyTestResult(`✅ Proxy working!\n\n${text.slice(0, 200)}...`);
                    reader.releaseLock();
                }
            } else {
                setProxyTestResult(`❌ Proxy failed: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            setProxyTestResult(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleTestUrl = async () => {
        if (!connectionState.server?.url) return;

        setProxyTestResult("Testing URL accessibility...");
        try {
            const response = await fetch(`/api/test-url?url=${encodeURIComponent(connectionState.server.url)}`);
            const result = await response.json();
            setProxyTestResult(`URL Test Results:\n\n${JSON.stringify(result, null, 2)}`);
        } catch (error) {
            setProxyTestResult(`❌ URL Test Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const debugInfo = {
        connectionStatus: connectionState.status,
        serverInfo: connectionState.server,
        capabilities: connectionState.capabilities,
        error: connectionState.error,
        errorDetails: connectionState.errorDetails,
        toolsCount: connectionState.tools.length,
        resourcesCount: connectionState.resources.length,
        promptsCount: connectionState.prompts.length,
        timestamp: new Date().toISOString(),
    };

    return (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bug className="h-5 w-5 text-blue-600" />
                                <CardTitle className="text-blue-800 dark:text-blue-200">
                                    Debug Panel
                                </CardTitle>
                                <Badge variant="outline" className="text-xs">
                                    Connection Status: {connectionState.status}
                                </Badge>
                            </div>
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </div>
                        <CardDescription className="text-blue-700 dark:text-blue-300">
                            Debug connection issues and test proxy functionality
                        </CardDescription>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                                    Connection Debug Info
                                </h4>
                                <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-md">
                                    <pre className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                                        {JSON.stringify(debugInfo, null, 2)}
                                    </pre>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-2"
                                        onClick={() => copyToClipboard(JSON.stringify(debugInfo, null, 2))}
                                    >
                                        <Copy className="h-3 w-3 mr-1" />
                                        Copy Debug Info
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                                    Test Proxy Connection
                                </h4>
                                <div className="space-y-2">
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                className="flex-1 px-3 py-2 border rounded-md text-sm"
                                                value={proxyTestUrl}
                                                onChange={(e) => setProxyTestUrl(e.target.value)}
                                                placeholder="Enter URL to test proxy..."
                                            />
                                            <Button size="sm" onClick={handleTestProxy}>
                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                Test Proxy
                                            </Button>
                                        </div>
                                        {connectionState.server?.url && (
                                            <Button size="sm" variant="outline" onClick={handleTestUrl} className="w-full">
                                                Test Current Server URL: {connectionState.server.url}
                                            </Button>
                                        )}
                                    </div>
                                    {proxyTestResult && (
                                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                                            <pre className="text-xs whitespace-pre-wrap">{proxyTestResult}</pre>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                                    Common Issues & Solutions
                                </h4>
                                <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                                    <div className="flex items-start gap-2">
                                        <span className="font-medium">EventSource Error:</span>
                                        <span>Check if the MCP server URL is correct and responding</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="font-medium">Connection Timeout:</span>
                                        <span>Server may be slow to respond or unreachable</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="font-medium">404 Error:</span>
                                        <span>MCP endpoint not found at the specified URL</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="font-medium">CORS Issues:</span>
                                        <span>Our proxy should handle this automatically</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md">
                                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                    <strong>Tip:</strong> Check the browser's Developer Console (F12) and the Next.js terminal
                                    for detailed error messages. Look for logs starting with "[SSE Proxy]" or "[MCP]".
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
