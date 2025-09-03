"use client";

import { useState } from "react";
import { Resource, ResourceTemplate } from "@modelcontextprotocol/sdk/types.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, FileText, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ResourcesTabProps {
    resources: Resource[];
    resourceTemplates: ResourceTemplate[];
    onReadResource: (uri: string) => Promise<any>;
    isConnected: boolean;
}

export function ResourcesTab({
    resources,
    resourceTemplates,
    onReadResource,
    isConnected
}: ResourcesTabProps) {
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
    const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
    const [resourceContent, setResourceContent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("overview");

    const toggleExpandedResource = (uri: string) => {
        const newExpanded = new Set(expandedResources);
        if (newExpanded.has(uri)) {
            newExpanded.delete(uri);
        } else {
            newExpanded.add(uri);
        }
        setExpandedResources(newExpanded);
    };

    const toggleExpandedTemplate = (uri: string) => {
        const newExpanded = new Set(expandedTemplates);
        if (newExpanded.has(uri)) {
            newExpanded.delete(uri);
        } else {
            newExpanded.add(uri);
        }
        setExpandedTemplates(newExpanded);
    };

    const handleReadResource = async (resource: Resource) => {
        setLoading(true);
        try {
            const content = await onReadResource(resource.uri);
            setResourceContent(content);
            setSelectedResource(resource);
            setActiveTab("reader");
        } catch (error) {
            console.error("Error reading resource:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderResourceCard = (resource: Resource) => (
        <Card key={resource.uri} className="overflow-hidden">
            <Collapsible
                open={expandedResources.has(resource.uri)}
                onOpenChange={() => toggleExpandedResource(resource.uri)}
            >
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {expandedResources.has(resource.uri) ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{resource.name || resource.uri}</CardTitle>
                                    {resource.description && (
                                        <CardDescription className="mt-1">
                                            {resource.description}
                                        </CardDescription>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {resource.mimeType && (
                                    <Badge variant="outline">{resource.mimeType}</Badge>
                                )}
                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReadResource(resource);
                                    }}
                                    disabled={!isConnected || loading}
                                >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Read
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="border-t pt-4 space-y-2">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-muted-foreground">URI:</span>
                                    <p className="font-mono text-xs break-all">{resource.uri}</p>
                                </div>
                                {resource.mimeType && (
                                    <div>
                                        <span className="font-medium text-muted-foreground">MIME Type:</span>
                                        <p>{resource.mimeType}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );

    const renderTemplateCard = (template: ResourceTemplate) => (
        <Card key={template.uriTemplate} className="overflow-hidden">
            <Collapsible
                open={expandedTemplates.has(template.uriTemplate)}
                onOpenChange={() => toggleExpandedTemplate(template.uriTemplate)}
            >
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {expandedTemplates.has(template.uriTemplate) ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                                <div>
                                    <CardTitle className="text-lg">{template.name || template.uriTemplate}</CardTitle>
                                    {template.description && (
                                        <CardDescription className="mt-1">
                                            {template.description}
                                        </CardDescription>
                                    )}
                                </div>
                            </div>
                            <Badge variant="secondary">Template</Badge>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="border-t pt-4 space-y-2">
                            <div>
                                <span className="font-medium text-muted-foreground">URI Template:</span>
                                <p className="font-mono text-xs break-all bg-muted p-2 rounded mt-1">
                                    {template.uriTemplate}
                                </p>
                            </div>
                            {template.mimeType && (
                                <div>
                                    <span className="font-medium text-muted-foreground">MIME Type:</span>
                                    <p>{template.mimeType}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );

    const renderResourcesList = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Resources</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    {resources.length} resource{resources.length !== 1 ? "s" : ""} available
                </p>

                {resources.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <Database className="h-12 w-12 text-muted-foreground mb-4" />
                            <h4 className="text-lg font-medium mb-2">No Resources Available</h4>
                            <p className="text-muted-foreground text-center max-w-md">
                                {isConnected
                                    ? "This server doesn't provide any resources, or resources are not supported."
                                    : "Connect to an MCP server to view available resources."}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {resources.map(renderResourceCard)}
                    </div>
                )}
            </div>

            {resourceTemplates.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Resource Templates</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {resourceTemplates.length} template{resourceTemplates.length !== 1 ? "s" : ""} available
                    </p>
                    <div className="space-y-3">
                        {resourceTemplates.map(renderTemplateCard)}
                    </div>
                </div>
            )}
        </div>
    );

    const renderResourceReader = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Resource Reader</h3>
                <p className="text-sm text-muted-foreground">
                    View and explore resource content
                </p>
            </div>

            {selectedResource ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {selectedResource.name || selectedResource.uri}
                        </CardTitle>
                        <CardDescription>{selectedResource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                                <div>
                                    <span className="font-medium text-muted-foreground">URI:</span>
                                    <p className="font-mono text-xs break-all">{selectedResource.uri}</p>
                                </div>
                                {selectedResource.mimeType && (
                                    <div>
                                        <span className="font-medium text-muted-foreground">MIME Type:</span>
                                        <p>{selectedResource.mimeType}</p>
                                    </div>
                                )}
                            </div>

                            {resourceContent && (
                                <div>
                                    <h5 className="font-medium mb-2">Content</h5>
                                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                                        {JSON.stringify(resourceContent, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-medium mb-2">Select a Resource</h4>
                        <p className="text-muted-foreground text-center max-w-md">
                            Choose a resource from the overview tab to read its content
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">
                    <Database className="w-4 h-4 mr-2" />
                    Overview
                </TabsTrigger>
                <TabsTrigger value="reader">
                    <FileText className="w-4 h-4 mr-2" />
                    Resource Reader
                </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
                {renderResourcesList()}
            </TabsContent>

            <TabsContent value="reader" className="mt-6">
                {renderResourceReader()}
            </TabsContent>
        </Tabs>
    );
}

