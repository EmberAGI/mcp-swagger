"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ServerSelector } from "@/components/ServerSelector";
import { ToolsTab } from "@/components/ToolsTab";
import { ResourcesTab } from "@/components/ResourcesTab";
import { ResourceTemplatesTab } from "@/components/ResourceTemplatesTab";
import { PromptsTab } from "@/components/PromptsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Code, Database, FileText, MessageSquare, Settings, Activity, Lock, ChevronDown, Send, History } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useMCPConnection } from "@/lib/hooks/useMCPConnection";
import { MCPServer, MCPServerConfig } from "@/lib/types/mcp";
import { loadServerConfig } from "@/config/servers";
import Image from "next/image";

export default function Home() {
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [customRequest, setCustomRequest] = useState("{\n  \"method\": \"\",\n  \"params\": {}\n}");
  const [requestHistory, setRequestHistory] = useState<Array<{ id: string; timestamp: Date; request: any; response: any; error?: string }>>([]);
  const [isSending, setIsSending] = useState(false);

  const {
    connectionState,
    connect,
    disconnect,
    readResource,
    getPrompt,
    callTool,
    makeRequest,
    handleCompletion,
    completionsSupported,
  } = useMCPConnection();

  const serverConfig = useMemo(() => loadServerConfig(), []);
  const hasAttemptedAutoConnectRef = useRef(false);

  // Auto-connect to the default server when the homepage is fully loaded
  useEffect(() => {
    if (hasAttemptedAutoConnectRef.current) return;

    const attemptAutoConnect = () => {
      if (hasAttemptedAutoConnectRef.current) return;
      if (connectionState.status === "disconnected" || connectionState.status === "error") {
        const defaultServerId = serverConfig.defaultServer;
        const defaultServer = defaultServerId ? serverConfig.servers[defaultServerId] : undefined;
        if (defaultServer) {
          hasAttemptedAutoConnectRef.current = true;
          connect(defaultServer as MCPServer);
        }
      }
    };

    if (document.readyState === "complete") {
      attemptAutoConnect();
    } else {
      window.addEventListener("load", attemptAutoConnect, { once: true });
      return () => window.removeEventListener("load", attemptAutoConnect);
    }
  }, [connectionState.status, serverConfig, connect]);

  const handleConnect = async (server: MCPServer) => {
    await connect(server);
    // The lists are now fetched automatically in the connect function
  };

  const addToHistory = (request: any, response: any, error?: string) => {
    const entry = { id: Date.now().toString(), timestamp: new Date(), request, response, error };
    setRequestHistory(prev => [entry, ...prev].slice(0, 50));
  };

  const handleCustomRequest = async () => {
    setIsSending(true);
    try {
      const request = JSON.parse(customRequest);
      const response = await makeRequest(request, {} as any);
      addToHistory(request, response);
    } catch (error) {
      let request;
      try {
        request = JSON.parse(customRequest);
      } catch {
        request = { error: "Invalid JSON" };
      }
      addToHistory(request, null, error instanceof Error ? error.message : String(error));
    } finally {
      setIsSending(false);
    }
  };

  const renderOverview = () => {
    if (connectionState.status !== "connected") {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connect to an MCP Server</h3>
          <p className="text-muted-foreground max-w-md">
            Select and connect to an MCP server to start exploring its capabilities,
            documentation, and test its tools, resources, and prompts.
          </p>
        </div>
      );
    }

    const { capabilities, tools, resources, prompts } = connectionState;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Server Overview</h2>
          <p className="text-muted-foreground">
            Connected to {connectionState.server?.name}. Explore the available capabilities below.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tools</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tools.length}</div>
              <p className="text-xs text-muted-foreground">
                {capabilities?.tools ? "Available" : "Not supported"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resources</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resources.length}</div>
              <p className="text-xs text-muted-foreground">
                {capabilities?.resources ? "Available" : "Not supported"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prompts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{prompts.length}</div>
              <p className="text-xs text-muted-foreground">
                {capabilities?.prompts ? "Available" : "Not supported"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant="success">Online</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Connected via {connectionState.server?.transport}
              </p>
            </CardContent>
          </Card>
        </div>

        {capabilities && (
          <Card>
            <CardHeader>
              <CardTitle>Server Capabilities</CardTitle>
              <CardDescription>
                Features and capabilities supported by this MCP server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Core Features</h4>
                  <div className="space-y-1">
                    {capabilities.tools && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Tools</Badge>
                        <span className="text-sm text-muted-foreground">
                          Function calling capabilities
                        </span>
                      </div>
                    )}
                    {capabilities.resources && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Resources</Badge>
                        <span className="text-sm text-muted-foreground">
                          Resource reading {capabilities.resources.subscribe && "& subscription"}
                        </span>
                      </div>
                    )}
                    {capabilities.prompts && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Prompts</Badge>
                        <span className="text-sm text-muted-foreground">
                          Prompt templates
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Advanced Features</h4>
                  <div className="space-y-1">
                    {capabilities.logging && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          border: '1px solid rgba(253, 103, 49, 0.3)',
                          borderRadius: '9999px',
                          color: '#FD6731',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>Logging</span>
                        <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          Server-side logging
                        </span>
                      </div>
                    )}
                    {capabilities.sampling ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          border: '1px solid rgba(253, 103, 49, 0.3)',
                          borderRadius: '9999px',
                          color: '#FD6731',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>Sampling</span>
                        <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          LLM sampling requests
                        </span>
                      </div>
                    ) : null}
                    {capabilities.completions ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          border: '1px solid rgba(253, 103, 49, 0.3)',
                          borderRadius: '9999px',
                          color: '#FD6731',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>Completions</span>
                        <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          Auto-completion support
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a' }}>
      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: '#2a2a2a' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Image src="/Logo (1).svg" alt="EmberAi Logo" width={32} height={32} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Image src="/name.svg" alt="EmberAi" width={144} height={25} />
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FD6731', marginLeft: '0.5rem' }}>MCP Explorer</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.25rem' }}>
                  Model Context Protocol API Documentation & Testing Tool
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowServerConfig(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid #FD6731',
                borderRadius: '0.375rem',
                color: '#FD6731',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(253, 103, 49, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Settings style={{ width: '1rem', height: '1rem' }} />
              Configure
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger asChild>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              gap: '0.5rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#fff',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <ChevronDown style={{ width: '1.25rem', height: '1.25rem', transition: 'transform 0.2s', color: '#FD6731' }} />
                MCP Server Connection
              </span>
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={(e) => e.stopPropagation()}
              >
                {connectionState.status === "connected" && (
                  <>
                    <Badge variant="success">Connected</Badge>
                    <button
                      onClick={() => disconnect()}
                      style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: 'transparent',
                        border: '1px solid #FD6731',
                        borderRadius: '0.375rem',
                        color: '#FD6731',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Disconnect
                    </button>
                  </>
                )}
                {connectionState.status === "connecting" && (
                  <>
                    <Badge variant="warning">Connecting...</Badge>
                    <button
                      onClick={() => disconnect()}
                      style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: 'transparent',
                        border: '1px solid #FD6731',
                        borderRadius: '0.375rem',
                        color: '#FD6731',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </>
                )}
                {(connectionState.status === "disconnected" || connectionState.status === "error") && (
                  <>
                    <Badge variant={connectionState.status === "error" ? "destructive" : "outline"}>
                      {connectionState.status === "error" ? "Error" : "Disconnected"}
                    </Badge>
                    <button
                      onClick={() => {
                        const defaultServerId = serverConfig.defaultServer;
                        const defaultServer = defaultServerId ? serverConfig.servers[defaultServerId] : undefined;
                        if (defaultServer) {
                          handleConnect(defaultServer as MCPServer);
                        }
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: 'transparent',
                        border: '1px solid #FD6731',
                        borderRadius: '0.375rem',
                        color: '#FD6731',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Connect
                    </button>
                  </>
                )}
              </span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent style={{ marginTop: '1rem' }}>
            <ServerSelector
              connectionState={connectionState}
              onConnect={handleConnect}
              onDisconnect={disconnect}
              onConfigureServers={() => setShowServerConfig(true)}
            />
          </CollapsibleContent>
        </Collapsible>

        <Tabs value={activeTab} onValueChange={setActiveTab} style={{ width: '100%' }}>
          <TabsList style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '0.5rem',
            padding: '0.25rem'
          }}>
            <TabsTrigger value="overview">
              <BookOpen className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="tools"
              disabled={!connectionState.capabilities?.tools}
            >
              <Code className="w-4 h-4 mr-2" />
              Tools
            </TabsTrigger>
            <TabsTrigger
              value="resources"
              disabled={!connectionState.capabilities?.resources}
            >
              <Database className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger
              value="resourceTemplates"
              disabled={!connectionState.capabilities?.resources}
            >
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="prompts"
              disabled={!connectionState.capabilities?.prompts}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Prompts
            </TabsTrigger>
            <TabsTrigger value="playground">
              <Activity className="w-4 h-4 mr-2" />
              Request
            </TabsTrigger>
            <TabsTrigger value="auth" disabled>
              <Lock className="w-4 h-4 mr-2" />
              Auth
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="tools" className="mt-6">
            <ToolsTab
              tools={connectionState.tools}
              onCallTool={callTool}
              isConnected={connectionState.status === "connected"}
            />
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <ResourcesTab
              resources={connectionState.resources}
              resourceTemplates={connectionState.resourceTemplates}
              onReadResource={readResource}
              isConnected={connectionState.status === "connected"}
            />
          </TabsContent>

          <TabsContent value="resourceTemplates" className="mt-6">
            <ResourceTemplatesTab
              resourceTemplates={connectionState.resourceTemplates}
              onReadResource={readResource}
              isConnected={connectionState.status === "connected"}
            />
          </TabsContent>

          <TabsContent value="prompts" className="mt-6">
            <PromptsTab
              prompts={connectionState.prompts}
              onGetPrompt={getPrompt}
              isConnected={connectionState.status === "connected"}
              handleCompletion={handleCompletion}
              completionsSupported={completionsSupported}
            />
          </TabsContent>



          <TabsContent value="playground" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
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
                        rows={12}
                        className="font-mono text-sm"
                        value={customRequest}
                        onChange={(e) => setCustomRequest(e.target.value)}
                        placeholder="Enter your MCP request as JSON..."
                      />
                    </div>
                    <Button
                      onClick={handleCustomRequest}
                      disabled={connectionState.status !== "connected" || isSending}
                      className="w-full"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSending ? "Sending..." : "Send Request"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <div>
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
                              custom
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
          </TabsContent>

        </Tabs>

        <Dialog open={showServerConfig} onOpenChange={setShowServerConfig}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Server Configuration</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="text-muted-foreground">Server configuration functionality has been removed.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}