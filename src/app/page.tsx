"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMCPConnection, PendingElicitationRequest } from "@/lib/hooks/useMCPConnection";
import { MCPServer } from "@/lib/types/mcp";
import { loadServerConfig } from "@/config/servers";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { Prompt } from "@modelcontextprotocol/sdk/types.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/types.js";
import { HeroSection } from "@/components/HeroSection";
import { CategoryFilters, CategoryFilter } from "@/components/CategoryFilters";
import { FilteredCardsSection } from "@/components/FilteredCardsSection";
import { ExecutionSection } from "@/components/ExecutionSection";
import { Footer } from "@/components/Footer";
import ConversationalPromptInput from "@/components/ConversationalPromptInput";
import { SafeConnectButton } from "@/components/SafeConnectButton";
import { PromptTemplate } from "@/config/prompts";
import { toolCategories } from "@/config/tools";
import ElicitationModal from "@/components/ElicitationModal";
import { ServerSelector } from "@/components/ServerSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Settings, HelpCircle } from "lucide-react";

type SelectedItem =
  | { type: "tool"; item: Tool }
  | { type: "prompt"; item: Prompt }
  | { type: "template"; item: ResourceTemplate }
  | null;

export default function Home() {
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [currentElicitation, setCurrentElicitation] = useState<PendingElicitationRequest | null>(null);

  const {
    connectionState,
    connect,
    disconnect,
    readResource,
    getPrompt,
    callTool,
    handleCompletion,
    completionsSupported,
    pendingElicitations,
    resolveElicitation,
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

  // Auto-show elicitation modal when new requests arrive
  useEffect(() => {
    if (pendingElicitations.length > 0 && !currentElicitation) {
      setCurrentElicitation(pendingElicitations[0]);
    }
  }, [pendingElicitations, currentElicitation]);

  const handleConnect = async (server: MCPServer) => {
    await connect(server);
  };

  const handlePromptSubmit = async (prompt: string, template?: PromptTemplate) => {
    console.log("Prompt submitted:", prompt);
    console.log("Template used:", template);
  };

  const handleElicitationClose = () => {
    setCurrentElicitation(null);
    if (pendingElicitations.length > 1) {
      const nextElicitation = pendingElicitations.find(e => e.id !== currentElicitation?.id);
      if (nextElicitation) {
        setTimeout(() => setCurrentElicitation(nextElicitation), 100);
      }
    }
  };

  const { tools, resources, prompts, resourceTemplates } = connectionState;

  // Calculate metrics for hero section
  const agentReadyActions = tools.length + resourceTemplates.length + prompts.length;
  const supportedChains = serverConfig.supportedChains || 3;
  const protocolCategories = toolCategories.length;

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="flex justify-center">
          <HeroSection
            agentReadyActions={agentReadyActions}
            supportedChains={supportedChains}
            protocolCategories={protocolCategories}
          />
        </div>

        {/* Filter Buttons and Connect Wallet Button */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <CategoryFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          <SafeConnectButton />
        </div>

        {/* Magic Input Box */}
        <div className="mt-6">
          <ConversationalPromptInput
            onSubmit={handlePromptSubmit}
            placeholder="Ask something or type a command... (try: swap, long, supply, borrow)"
            onCallTool={callTool}
            onGetPrompt={getPrompt}
            handleCompletion={handleCompletion}
            completionsSupported={completionsSupported}
            isConnected={connectionState.status === "connected"}
          />
        </div>

        {/* Filtered Cards Section */}
        {connectionState.status === "connected" && (
          <FilteredCardsSection
            tools={tools}
            prompts={prompts}
            resourceTemplates={resourceTemplates}
            activeFilter={activeFilter}
            onToolSelect={(tool) => setSelectedItem({ type: "tool", item: tool })}
            onPromptSelect={(prompt) => setSelectedItem({ type: "prompt", item: prompt })}
            onTemplateSelect={(template) => setSelectedItem({ type: "template", item: template })}
          />
        )}

        {/* Execution Section */}
        {selectedItem && connectionState.status === "connected" && (
          <ExecutionSection
            selectedItem={selectedItem}
            tools={tools}
            prompts={prompts}
            resourceTemplates={resourceTemplates}
            onCallTool={callTool}
            onGetPrompt={getPrompt}
            onReadResource={readResource}
            isConnected={connectionState.status === "connected"}
            handleCompletion={handleCompletion}
            completionsSupported={completionsSupported}
          />
        )}

        {/* Metric Cards Below Execution Section */}
        {connectionState.status === "connected" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-[#18181B] border border-gray-700 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">{agentReadyActions}</div>
              <div className="text-sm text-gray-400">Agent-ready actions</div>
            </div>
            <div className="bg-[#18181B] border border-gray-700 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">{supportedChains}</div>
              <div className="text-sm text-gray-400">Supported Chains</div>
            </div>
            <div className="bg-[#18181B] border border-gray-700 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">{protocolCategories}</div>
              <div className="text-sm text-gray-400">Protocol categories</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Server Connection Section Below Footer */}
      <div className="w-full border-t border-gray-800 bg-[#09090B]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <ChevronDown className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium text-gray-300">MCP Server Connection</span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <ServerSelector
                    connectionState={connectionState}
                    onConnect={handleConnect}
                    onDisconnect={disconnect}
                    onConfigureServers={() => setShowServerConfig(true)}
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>
            <div className="flex items-center gap-3">
              {pendingElicitations.length > 0 && (
                <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-xs font-medium">
                  <HelpCircle className="w-3 h-3" />
                  {pendingElicitations.length} request{pendingElicitations.length > 1 ? 's' : ''} pending
                </div>
              )}
              {connectionState.status === "connected" && (
                <>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Connected</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnect()}
                    className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
                  >
                    Disconnect
                  </Button>
                </>
              )}
              {connectionState.status === "connecting" && (
                <>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Connecting...</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnect()}
                    className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
                  >
                    Cancel
                  </Button>
                </>
              )}
              {(connectionState.status === "disconnected" || connectionState.status === "error") && (
                <>
                  <Badge className={connectionState.status === "error" ? "bg-red-500/20 text-red-400 border-red-500/50" : "bg-gray-500/20 text-gray-400 border-gray-500/50"}>
                    {connectionState.status === "error" ? "Error" : "Disconnected"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const defaultServerId = serverConfig.defaultServer;
                      const defaultServer = defaultServerId ? serverConfig.servers[defaultServerId] : undefined;
                      if (defaultServer) {
                        handleConnect(defaultServer as MCPServer);
                      }
                    }}
                    className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
                  >
                    Connect
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowServerConfig(true)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Elicitation Modal */}
      <ElicitationModal
        request={currentElicitation}
        onResolve={resolveElicitation}
        onClose={handleElicitationClose}
      />
    </div>
  );
}
