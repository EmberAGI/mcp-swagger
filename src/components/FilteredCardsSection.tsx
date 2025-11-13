"use client";

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { Prompt } from "@modelcontextprotocol/sdk/types.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/types.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, MessageSquare, FileText } from "lucide-react";
import { getToolConfig, getCategoryConfig } from "@/config/tools";
import { promptTemplates } from "@/config/prompts";
import { getResourceTemplateCategory, getResourceTemplateConfig } from "@/config/resourceTemplates";
import { CategoryFilter } from "./CategoryFilters";

interface FilteredCardsSectionProps {
  tools: Tool[];
  prompts: Prompt[];
  resourceTemplates: ResourceTemplate[];
  activeFilter: CategoryFilter;
  onToolSelect: (tool: Tool) => void;
  onPromptSelect: (prompt: Prompt) => void;
  onTemplateSelect: (template: ResourceTemplate) => void;
}

export function FilteredCardsSection({
  tools,
  prompts,
  resourceTemplates,
  activeFilter,
  onToolSelect,
  onPromptSelect,
  onTemplateSelect,
}: FilteredCardsSectionProps) {
  // Filter tools by category
  const filteredTools = tools.filter((tool) => {
    if (activeFilter === "all") return true;
    const config = getToolConfig(tool.name);
    if (!config) return false;
    return config.category === activeFilter;
  });

  // Filter prompts by category
  const filteredPrompts = prompts.filter((prompt) => {
    if (activeFilter === "all") return true;
    const template = promptTemplates.find((pt) => pt.id === prompt.name);
    return template?.category === activeFilter;
  });

  // Filter resource templates by category
  const filteredTemplates = resourceTemplates.filter((template) => {
    if (activeFilter === "all") return true;
    const category = getResourceTemplateCategory(template.name);
    return category === activeFilter;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {/* Order: Tools, Prompts, Templates */}
      {/* 1. Tools Card */}
      {filteredTools.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-lg">Tools</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                {filteredTools.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTools.map((tool) => {
                const config = getToolConfig(tool.name);
                const category = config ? getCategoryConfig(config.category) : null;
                return (
                  <div
                    key={tool.name}
                    onClick={() => onToolSelect(tool)}
                    className="p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900 cursor-pointer transition-colors border border-gray-700 hover:border-blue-500"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-white mb-1 truncate">
                          {config?.name || tool.name}
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-2">
                          {config?.description || tool.description || "No description available"}
                        </div>
                      </div>
                    </div>
                    {category && (
                      <Badge
                        variant="outline"
                        className="mt-2 text-xs"
                        style={{
                          borderColor: `var(--color-${category.color})`,
                          color: `var(--color-${category.color})`,
                        }}
                      >
                        {category.name}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Prompts Card */}
      {filteredPrompts.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-lg">Prompts</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                {filteredPrompts.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPrompts.map((prompt) => {
                const template = promptTemplates.find((pt) => pt.id === prompt.name);
                return (
                  <div
                    key={prompt.name}
                    onClick={() => onPromptSelect(prompt)}
                    className="p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900 cursor-pointer transition-colors border border-gray-700 hover:border-purple-500"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-white mb-1 truncate">
                          {template?.name || prompt.name}
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-2">
                          {template?.description || prompt.description || "No description available"}
                        </div>
                      </div>
                    </div>
                    {template?.category && (() => {
                      const categoryConfig = getCategoryConfig(template.category);
                      return (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {categoryConfig?.name || template.category}
                        </Badge>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Templates Card */}
      {filteredTemplates.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <CardTitle className="text-lg">Templates</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400">
                {filteredTemplates.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTemplates.map((template) => {
                const category = getResourceTemplateCategory(template.name);
                return (
                  <div
                    key={template.name}
                    onClick={() => onTemplateSelect(template)}
                    className="p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900 cursor-pointer transition-colors border border-gray-700 hover:border-cyan-500"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-white mb-1 truncate">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-2">
                          {template.description || "No description available"}
                        </div>
                        {template.uriTemplate && (
                          <div className="text-xs text-gray-500 mt-1 font-mono">
                            {template.uriTemplate}
                          </div>
                        )}
                      </div>
                    </div>
                    {(() => {
                      const categoryConfig = getCategoryConfig(category);
                      return (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {categoryConfig?.name || category}
                        </Badge>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

