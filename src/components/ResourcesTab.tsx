"use client";

import { useEffect, useRef, useState } from "react";
import { Resource, ResourceTemplate } from "@modelcontextprotocol/sdk/types.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    // Debug logging
    console.log('[ResourcesTab] Received props:', {
        resourcesCount: resources.length,
        resourceTemplatesCount: resourceTemplates.length,
        isConnected,
        resources: resources.map(r => ({ uri: r.uri, name: r.name, mimeType: r.mimeType }))
    });
    const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
    const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
    const [showDocs, setShowDocs] = useState<boolean>(false);
    const [contentByUri, setContentByUri] = useState<Record<string, any>>({});
    const [loadingByUri, setLoadingByUri] = useState<Record<string, boolean>>({});
    const [errorByUri, setErrorByUri] = useState<Record<string, string | null>>({});

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
        const uri = resource.uri;
        setLoadingByUri(prev => ({ ...prev, [uri]: true }));
        setErrorByUri(prev => ({ ...prev, [uri]: null }));
        try {
            const content = await onReadResource(uri);
            setContentByUri(prev => ({ ...prev, [uri]: content }));
            setShowDocs(false);
        } catch (error: any) {
            setErrorByUri(prev => ({ ...prev, [uri]: error?.message || String(error) }));
        } finally {
            setLoadingByUri(prev => ({ ...prev, [uri]: false }));
        }
    };

    // Auto-expand the first resource only once to avoid a blank interactive view
    const hasAutoExpandedRef = useRef(false);
    useEffect(() => {
        if (!showDocs && resources.length > 0 && !hasAutoExpandedRef.current) {
            setExpandedResources(new Set([resources[0].uri]));
            hasAutoExpandedRef.current = true;
        }
    }, [resources, showDocs]);

    const renderInteractiveResourceCard = (resource: Resource) => (
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

                            <div className="pt-3">
                                <Button
                                    size="sm"
                                    onClick={() => handleReadResource(resource)}
                                    disabled={!isConnected || !!loadingByUri[resource.uri]}
                                >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    {loadingByUri[resource.uri] ? "Reading..." : "Read"}
                                </Button>
                            </div>

                            {errorByUri[resource.uri] && (
                                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                                    {errorByUri[resource.uri]}
                                </div>
                            )}

                            {contentByUri[resource.uri] && (
                                <div>
                                    <h5 className="font-medium mb-2">Content</h5>
                                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                                        {JSON.stringify(contentByUri[resource.uri], null, 2)}
                                    </pre>
                                </div>
                            )}
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

    const renderDocsList = () => (
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
                        {resources.map((r) => (
                            <Card key={r.uri} className="overflow-hidden">
                                <Collapsible
                                    open={expandedResources.has(r.uri)}
                                    onOpenChange={() => toggleExpandedResource(r.uri)}
                                >
                                    <CollapsibleTrigger asChild>
                                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {expandedResources.has(r.uri) ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                    <div className="flex-1">
                                                        <CardTitle className="text-lg">{r.name || r.uri}</CardTitle>
                                                        {r.description && (
                                                            <CardDescription className="mt-1">
                                                                {r.description}
                                                            </CardDescription>
                                                        )}
                                                    </div>
                                                </div>
                                                {r.mimeType && <Badge variant="outline">{r.mimeType}</Badge>}
                                            </div>
                                        </CardHeader>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <CardContent className="pt-0">
                                            <div className="border-t pt-4 space-y-2">
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="font-medium text-muted-foreground">URI:</span>
                                                        <p className="font-mono text-xs break-all">{r.uri}</p>
                                                    </div>
                                                    {r.mimeType && (
                                                        <div>
                                                            <span className="font-medium text-muted-foreground">MIME Type:</span>
                                                            <p>{r.mimeType}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </CollapsibleContent>
                                </Collapsible>
                            </Card>
                        ))}
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

    const renderInteractiveList = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowDocs(true)}>Docs</Button>
            </div>

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
                    {resources.map(renderInteractiveResourceCard)}
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full">
            {showDocs ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-end">
                        <Button variant="outline" size="sm" onClick={() => setShowDocs(false)}>Back to Interactive</Button>
                    </div>
                    {renderDocsList()}
                </div>
            ) : (
                renderInteractiveList()
            )}
        </div>
    );
}

