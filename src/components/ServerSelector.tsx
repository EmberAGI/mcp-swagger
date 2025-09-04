"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Square, Settings, Link, Server, Copy } from "lucide-react";
import { MCPServer, ConnectionState, TransportType } from "@/lib/types/mcp";
import { loadServerConfig } from "@/config/servers";
import { CorsErrorHelp } from "./CorsErrorHelp";
import { DebugPanel } from "./DebugPanel";
import { SessionMCPHelp } from "./SessionMCPHelp";

interface ServerSelectorProps {
    connectionState: ConnectionState;
    onConnect: (server: MCPServer) => void;
    onDisconnect: () => void;
    onConfigureServers: () => void;
}

export function ServerSelector({
    connectionState,
    onConnect,
    onDisconnect,
    onConfigureServers,
}: ServerSelectorProps) {
    const serverConfig = loadServerConfig();
    const [selectedServerId, setSelectedServerId] = useState<string>(serverConfig.defaultServer || "emberai");
    const [customUrl, setCustomUrl] = useState<string>("https://api.emberai.xyz/mcp");
    const [connectionMode, setConnectionMode] = useState<"preset" | "custom">("preset");
    const [transportType, setTransportType] = useState<TransportType>("streamable-http");
    const [sessionId, setSessionId] = useState<string>("");
    const [availableSessionId, setAvailableSessionId] = useState<string>("");

    const selectedServer = selectedServerId ? serverConfig.servers[selectedServerId] : null;
    const isConnected = connectionState.status === "connected";
    const isConnecting = connectionState.status === "connecting";

    const getStatusBadge = () => {
        switch (connectionState.status) {
            case "connected":
                return <Badge variant="success">Connected</Badge>;
            case "connecting":
                return <Badge variant="warning">Connecting...</Badge>;
            case "error":
                return <Badge variant="destructive">Error</Badge>;
            default:
                return <Badge variant="outline">Disconnected</Badge>;
        }
    };

    // Listen for connection state changes to extract session ID
    useEffect(() => {
        if (connectionState.status === "error" && connectionState.errorDetails) {
            const errorMessage = connectionState.errorDetails.message || "";

            // Check if this is a session ID error
            if (errorMessage.includes("No valid session ID provided") ||
                errorMessage.includes("session ID")) {

                // Try to get a session ID from the proxy
                const url = connectionMode === "custom" ? customUrl : selectedServer?.url;
                if (url) {
                    fetch(`/api/mcp-proxy/streamable-http?url=${encodeURIComponent(url)}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            jsonrpc: "2.0",
                            id: 999,
                            method: "initialize",
                            params: {
                                protocolVersion: "2024-11-05",
                                capabilities: {},
                                clientInfo: { name: "mcp-swagger-probe", version: "1.0.0" }
                            }
                        })
                    })
                        .then(response => response.headers.get("mcp-session-id"))
                        .then(sessionId => {
                            if (sessionId) {
                                setAvailableSessionId(sessionId);
                                console.log("[MCP] Generated session ID:", sessionId);
                            }
                        })
                        .catch(() => { });
                }
            }
        }
    }, [connectionState, customUrl, selectedServer, connectionMode]);

    const handleConnect = () => {
        if (connectionMode === "preset" && selectedServer) {
            onConnect({
                ...selectedServer
            });
        } else if (connectionMode === "custom") {
            if (transportType === "streamable-http") {
                if (!customUrl.trim()) return;
                const customServer: MCPServer = {
                    name: `Custom Server (${customUrl})`,
                    transport: transportType,
                    url: customUrl.trim(),

                    description: `Custom ${transportType.toUpperCase()} server connection`
                };
                onConnect(customServer);
            } else if (transportType === "stdio") {
                if (!customUrl.trim()) return;
                const customServer: MCPServer = {
                    name: `Custom Server (${customUrl})`,
                    transport: "stdio",
                    command: customUrl.trim(),
                    description: "Custom STDIO server connection"
                };
                onConnect(customServer);
            }
        }
    };

    const handleRetryWithSession = (sessionId: string) => {
        if (connectionState.server?.url) {
            const urlWithSession = `${connectionState.server.url}?session=${encodeURIComponent(sessionId)}`;
            const serverWithSession: MCPServer = {
                ...connectionState.server,
                url: urlWithSession,
                name: `${connectionState.server.name} (with session)`,
                description: `${connectionState.server.description} - Using session ID`
            };
            onConnect(serverWithSession);
        }
    };



    const canConnect = connectionMode === "preset" ? selectedServer :
        (connectionMode === "custom" && customUrl.trim());

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">MCP Server Connection</CardTitle>
                        <CardDescription>
                            Select and connect to an MCP server to start exploring its capabilities
                        </CardDescription>
                    </div>
                    {getStatusBadge()}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Transport Type Selector */}
                <div className="space-y-2">
                    <Label htmlFor="transport-select">Transport Type</Label>
                    <Select
                        value={transportType}
                        onValueChange={(value) => setTransportType(value as TransportType)}
                        disabled={isConnected}
                    >
                        <SelectTrigger id="transport-select">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="streamable-http">
                                <div className="flex items-center gap-2">
                                    <span>🔗 Streamable HTTP</span>
                                    <Badge variant="outline" className="text-xs">Recommended</Badge>
                                </div>
                            </SelectItem>
                            <SelectItem value="stdio">
                                <div className="flex items-center gap-2">
                                    <span>💻 STDIO</span>
                                    <Badge variant="outline" className="text-xs">Local</Badge>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {transportType === "streamable-http" && "Modern HTTP streaming transport with built-in session management"}
                        {transportType === "stdio" && "Connect to local MCP servers via standard input/output"}
                    </p>
                </div>

                <Tabs value={connectionMode} onValueChange={(value) => setConnectionMode(value as "preset" | "custom")}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="preset" disabled={isConnected}>
                            <Server className="w-4 h-4 mr-2" />
                            Preset Servers
                        </TabsTrigger>
                        <TabsTrigger value="custom" disabled={isConnected}>
                            <Link className="w-4 h-4 mr-2" />
                            Custom {transportType === "streamable-http" ? "URL" : "Command"}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="preset" className="space-y-4 mt-4">
                        <div className="flex gap-2">
                            <Select
                                value={selectedServerId}
                                onValueChange={setSelectedServerId}
                                disabled={isConnected}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select an MCP server..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(serverConfig.servers).map(([id, server]) => (
                                        <SelectItem key={id} value={id}>
                                            <div className="flex items-center gap-2">
                                                <span>{server.name}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {server.transport}
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onConfigureServers}
                                title="Configure servers"
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="custom-url">
                                {transportType === "streamable-http" ? "Server URL" : "Command"}
                            </Label>
                            <Input
                                id="custom-url"
                                type={transportType === "streamable-http" ? "url" : "text"}
                                placeholder={
                                    transportType === "streamable-http"
                                        ? "https://your-mcp-server.com/endpoint"
                                        : "npx @modelcontextprotocol/server-filesystem /tmp"
                                }
                                value={customUrl}
                                onChange={(e) => setCustomUrl(e.target.value)}
                                disabled={isConnected}
                            />
                            <p className="text-xs text-muted-foreground">
                                {transportType === "streamable-http" && "Enter a direct URL to connect to an MCP server via Streamable HTTP transport"}
                                {transportType === "stdio" && "Enter a command to run a local MCP server (e.g., npx @modelcontextprotocol/server-filesystem)"}
                            </p>
                        </div>

                        {transportType === "streamable-http" && (
                            <div className="space-y-2">
                                <Label htmlFor="session-id">Session ID (Optional)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="session-id"
                                        type="text"
                                        placeholder="Leave empty for auto-generation"
                                        value={sessionId}
                                        onChange={(e) => setSessionId(e.target.value)}
                                        disabled={isConnected}
                                    />
                                    {availableSessionId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSessionId(availableSessionId)}
                                            disabled={isConnected}
                                            title="Use available session ID"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                {availableSessionId && !sessionId && (
                                    <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                                        <p className="text-xs text-green-700 font-medium">
                                            🎉 Session ID Available!
                                        </p>
                                        <p className="text-xs text-green-600 mb-2">
                                            {availableSessionId}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSessionId(availableSessionId)}
                                            className="text-xs h-7"
                                        >
                                            Use this Session ID
                                        </Button>
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Some MCP servers require a session ID. If connection fails, a session ID will be generated automatically.
                                </p>
                            </div>
                        )}

                    </TabsContent>
                </Tabs>

                <div className="flex gap-2">
                    {isConnected ? (
                        <Button onClick={onDisconnect} variant="destructive" className="flex-1">
                            <Square className="h-4 w-4 mr-2" />
                            Disconnect
                        </Button>
                    ) : (
                        <Button
                            onClick={handleConnect}
                            disabled={!canConnect || isConnecting}
                            className="flex-1"
                        >
                            <Play className="h-4 w-4 mr-2" />
                            {isConnecting ? "Connecting..." : "Connect"}
                        </Button>
                    )}
                </div>

                {((connectionMode === "preset" && selectedServer) || (connectionMode === "custom" && customUrl)) && (
                    <div className="pt-2 border-t">
                        <h4 className="font-medium text-sm mb-2">Connection Details</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            {connectionMode === "preset" && selectedServer ? (
                                <>
                                    <div>
                                        <span className="font-medium">Transport:</span> {selectedServer.transport}
                                    </div>
                                    {selectedServer.url && (
                                        <div>
                                            <span className="font-medium">URL:</span> {selectedServer.url}
                                        </div>
                                    )}
                                    {selectedServer.command && (
                                        <div>
                                            <span className="font-medium">Command:</span> {selectedServer.command}
                                            {selectedServer.args && ` ${selectedServer.args.join(" ")}`}
                                        </div>
                                    )}
                                    {selectedServer.description && (
                                        <div>
                                            <span className="font-medium">Description:</span> {selectedServer.description}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div>
                                        <span className="font-medium">Transport:</span> {transportType}
                                    </div>
                                    <div>
                                        <span className="font-medium">{transportType === "stdio" ? "Command" : "URL"}:</span> {customUrl}
                                    </div>
                                    <div>
                                        <span className="font-medium">Description:</span> Custom {transportType} server connection
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {connectionState.error && (
                    <div className="space-y-3">
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-sm text-destructive font-medium">Connection Error</p>
                            <p className="text-sm text-destructive/80">{connectionState.error}</p>
                        </div>

                        {(connectionState.error.toLowerCase().includes('cors') ||
                            connectionState.error.toLowerCase().includes('cross-origin') ||
                            connectionState.error.toLowerCase().includes('blocked')) && (
                                <CorsErrorHelp />
                            )}

                        {(connectionState.error.toLowerCase().includes('session') ||
                            connectionState.error.toLowerCase().includes('invalid or missing session id') ||
                            connectionState.server?.url?.includes('emberai')) && (
                                <SessionMCPHelp
                                    serverUrl={connectionState.server?.url || ""}
                                    onRetryWithSession={handleRetryWithSession}
                                />
                            )}
                    </div>
                )}

                <DebugPanel
                    connectionState={connectionState}
                    onTestProxy={(url) => console.log("Testing proxy with URL:", url)}
                />
            </CardContent>
        </Card>
    );
}
