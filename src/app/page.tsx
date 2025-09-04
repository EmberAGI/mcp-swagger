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
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-[#FD6731]/30 text-[#FD6731]">Logging</Badge>
                        <span className="text-sm text-muted-foreground">
                          Server-side logging
                        </span>
                      </div>
                    )}
                    {capabilities.sampling && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-[#FD6731]/30 text-[#FD6731]">Sampling</Badge>
                        <span className="text-sm text-muted-foreground">
                          LLM sampling requests
                        </span>
                      </div>
                    )}
                    {capabilities.completions && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-[#FD6731]/30 text-[#FD6731]">Completions</Badge>
                        <span className="text-sm text-muted-foreground">
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
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1A1A1A] border-b border-[#FD6731]/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/ember-logo.svg" alt="EmberAI Logo" className="h-8 w-auto" />
              <div className="flex items-center gap-3">
                <img src="/ember-name.svg" alt="EmberAI" className="h-5 w-auto" />
                <div className="w-px h-8 bg-white/20"></div>
                <div>
                  <h1 className="text-2xl font-bold text-white">MCP Explorer</h1>
                  <p className="text-sm text-white/70">
                    Model Context Protocol API Documentation & Testing Tool
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowServerConfig(true)}
              className="bg-[#FD6731]/10 hover:bg-[#FD6731]/20 text-white border-[#FD6731]/30"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 text-lg font-semibold hover:underline">
            <ChevronDown className="h-5 w-5 transition-transform data-[state=closed]:-rotate-90" />
            MCP Server Connection
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <ServerSelector
              connectionState={connectionState}
              onConnect={handleConnect}
              onDisconnect={disconnect}
              onConfigureServers={() => setShowServerConfig(true)}
            />
          </CollapsibleContent>
        </Collapsible>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
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