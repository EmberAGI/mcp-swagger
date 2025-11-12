"use client";

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { Prompt } from "@modelcontextprotocol/sdk/types.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/types.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolsTab } from "./ToolsTab";
import { PromptsTab } from "./PromptsTab";
import { ResourceTemplatesTab } from "./ResourceTemplatesTab";
import { useState, useEffect } from "react";

type SelectedItem =
  | { type: "tool"; item: Tool }
  | { type: "prompt"; item: Prompt }
  | { type: "template"; item: ResourceTemplate }
  | null;

interface ExecutionSectionProps {
  selectedItem: SelectedItem;
  tools: Tool[];
  prompts: Prompt[];
  resourceTemplates: ResourceTemplate[];
  onCallTool: (name: string, args: Record<string, unknown>) => Promise<any>;
  onGetPrompt: (name: string, args?: Record<string, string>) => Promise<any>;
  onReadResource: (uri: string) => Promise<any>;
  isConnected: boolean;
  handleCompletion?: (
    ref: { type: "ref/prompt"; name: string },
    argName: string,
    value: string,
    context?: Record<string, string>,
    signal?: AbortSignal
  ) => Promise<string[]>;
  completionsSupported?: boolean;
}

export function ExecutionSection({
  selectedItem,
  tools,
  prompts,
  resourceTemplates,
  onCallTool,
  onGetPrompt,
  onReadResource,
  isConnected,
  handleCompletion,
  completionsSupported = false,
}: ExecutionSectionProps) {
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Reset results when selected item changes
  useEffect(() => {
    setExecutionResult(null);
    setExecutionError(null);
  }, [selectedItem]);

  if (!selectedItem) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Left Column: Parameters and Execution */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle>
            {selectedItem.type === "tool" && "Tool Parameters"}
            {selectedItem.type === "prompt" && "Prompt Parameters"}
            {selectedItem.type === "template" && "Template Parameters"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedItem.type === "tool" && (
            <ToolsTab
              tools={[selectedItem.item]}
              onCallTool={onCallTool}
              isConnected={isConnected}
            />
          )}
          {selectedItem.type === "prompt" && (
            <PromptsTab
              prompts={[selectedItem.item]}
              onGetPrompt={onGetPrompt}
              isConnected={isConnected}
              handleCompletion={handleCompletion}
              completionsSupported={completionsSupported}
            />
          )}
          {selectedItem.type === "template" && (
            <ResourceTemplatesTab
              resourceTemplates={[selectedItem.item]}
              onReadResource={onReadResource}
              isConnected={isConnected}
            />
          )}
        </CardContent>
      </Card>

      {/* Right Column: Results */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          {executionResult ? (
            <div className="space-y-4">
              <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-sm text-gray-300">
                {JSON.stringify(executionResult, null, 2)}
              </pre>
            </div>
          ) : executionError ? (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <div className="text-red-400 text-sm">{executionError}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 text-center py-8">
              Results will appear here after execution
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

