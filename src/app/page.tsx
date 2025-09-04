"use client";

import { useState } from "react";
import { ServerSelector } from "@/components/ServerSelector";
import { ToolsTab } from "@/components/ToolsTab";
import { ResourcesTab } from "@/components/ResourcesTab";
import { PromptsTab } from "@/components/PromptsTab";
import { PlaygroundTab } from "@/components/PlaygroundTab";
import { ConfigTab } from "@/components/ConfigTab";
import { AuthTab } from "@/components/AuthTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Code, Database, MessageSquare, Settings, Activity, Lock, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useMCPConnection } from "@/lib/hooks/useMCPConnection";
import { MCPServer, MCPServerConfig } from "@/lib/types/mcp";

export default function Home() {
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const {
    connectionState,
    connect,
    disconnect,
    listTools,
    listResources,
    listResourceTemplates,
    listPrompts,
    readResource,
    getPrompt,
    callTool,
    makeRequest,
    handleCompletion,
    completionsSupported,
  } = useMCPConnection();

  const handleConnect = async (server: MCPServer) => {
    await connect(server);
    // The lists are now fetched automatically in the connect function
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

    const { capabilities, tools, resources, resourceTemplates, prompts } = connectionState;

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
                    {capabilities.sampling && (
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
                    )}
                    {capabilities.completions && (
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
                    )}
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
              <img src="/Logo (1).svg" alt="EmberAi Logo" style={{ width: '32px', height: '32px' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src="/name.svg" alt="EmberAi" style={{ height: '24px' }} />
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FD6731', marginLeft: '0.5rem' }}>MCP Swagger</span>
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
        <Collapsible defaultOpen>
          <CollapsibleTrigger style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#fff',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}>
            <ChevronDown style={{ width: '1.25rem', height: '1.25rem', transition: 'transform 0.2s', color: '#FD6731' }} />
            MCP Server Connection
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
            gridTemplateColumns: 'repeat(7, 1fr)',
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
              value="prompts"
              disabled={!connectionState.capabilities?.prompts}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Prompts
            </TabsTrigger>
            <TabsTrigger value="auth">
              <Lock className="w-4 h-4 mr-2" />
              Auth
            </TabsTrigger>
            <TabsTrigger value="playground">
              <Activity className="w-4 h-4 mr-2" />
              Playground
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="w-4 h-4 mr-2" />
              Config
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

          <TabsContent value="prompts" className="mt-6">
            <PromptsTab
              prompts={connectionState.prompts}
              onGetPrompt={getPrompt}
              isConnected={connectionState.status === "connected"}
              handleCompletion={handleCompletion}
              completionsSupported={completionsSupported}
            />
          </TabsContent>

          <TabsContent value="auth" className="mt-6">
            <AuthTab connectionState={connectionState} />
          </TabsContent>

          <TabsContent value="playground" className="mt-6">
            <PlaygroundTab
              tools={connectionState.tools}
              resources={connectionState.resources}
              prompts={connectionState.prompts}
              onCallTool={callTool}
              onReadResource={readResource}
              onGetPrompt={getPrompt}
              onMakeRequest={makeRequest}
              isConnected={connectionState.status === "connected"}
            />
          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <ConfigTab
              onConfigUpdate={(config: MCPServerConfig) => {
                console.log("Configuration updated:", config);
              }}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={showServerConfig} onOpenChange={setShowServerConfig}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Server Configuration</DialogTitle>
            </DialogHeader>
            <ConfigTab
              onConfigUpdate={(config: MCPServerConfig) => {
                console.log("Configuration updated:", config);
                setShowServerConfig(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}