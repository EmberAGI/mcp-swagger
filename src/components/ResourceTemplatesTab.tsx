"use client";

import { useEffect, useRef, useState } from "react";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/types.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ResourceTemplatesTabProps {
    resourceTemplates: ResourceTemplate[];
    onReadResource: (uri: string) => Promise<any>;
    isConnected: boolean;
}

export function ResourceTemplatesTab({
    resourceTemplates,
    onReadResource,
    isConnected
}: ResourceTemplatesTabProps) {
    // Debug logging
    console.log('[ResourceTemplatesTab] Received props:', {
        resourceTemplatesCount: resourceTemplates.length,
        isConnected,
        resourceTemplates: resourceTemplates.map(rt => ({
            name: rt.name,
            uriTemplate: rt.uriTemplate,
            mimeType: rt.mimeType
        }))
    });

    const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
    const [showDocs, setShowDocs] = useState<boolean>(false);
    const [contentByUri, setContentByUri] = useState<Record<string, any>>({});
    const [loadingByUri, setLoadingByUri] = useState<Record<string, boolean>>({});
    const [errorByUri, setErrorByUri] = useState<Record<string, string | null>>({});
    const [templateInputs, setTemplateInputs] = useState<Record<string, Record<string, string>>>({});

    const toggleExpandedTemplate = (templateName: string) => {
        const newExpanded = new Set(expandedTemplates);
        if (newExpanded.has(templateName)) {
            newExpanded.delete(templateName);
        } else {
            newExpanded.add(templateName);
        }
        setExpandedTemplates(newExpanded);
    };

    // Auto-expand the first template only once to avoid a blank interactive view
    const hasAutoExpandedRef = useRef(false);
    useEffect(() => {
        if (!showDocs && resourceTemplates.length > 0 && !hasAutoExpandedRef.current) {
            setExpandedTemplates(new Set([resourceTemplates[0].name]));
            hasAutoExpandedRef.current = true;
        }
    }, [resourceTemplates, showDocs]);

    const extractVariables = (uriTemplate: string): string[] => {
        const matches = uriTemplate.match(/\{([^}]+)\}/g);
        return matches ? matches.map(match => match.slice(1, -1)) : [];
    };

    const buildUri = (template: ResourceTemplate): string => {
        let uri = template.uriTemplate;
        const variables = extractVariables(template.uriTemplate);
        const inputs = templateInputs[template.name] || {};

        variables.forEach(variable => {
            const value = inputs[variable] || '';
            uri = uri.replace(`{${variable}}`, value);
        });

        return uri;
    };

    const handleInputChange = (templateName: string, variable: string, value: string) => {
        setTemplateInputs(prev => ({
            ...prev,
            [templateName]: {
                ...(prev[templateName] || {}),
                [variable]: value
            }
        }));
    };

    const handleReadResource = async (template: ResourceTemplate) => {
        const uri = buildUri(template);
        if (!uri || uri.includes('{')) {
            setErrorByUri(prev => ({ ...prev, [template.name]: 'Please fill in all template variables' }));
            return;
        }

        setLoadingByUri(prev => ({ ...prev, [template.name]: true }));
        setErrorByUri(prev => ({ ...prev, [template.name]: null }));

        try {
            const content = await onReadResource(uri);
            setContentByUri(prev => ({ ...prev, [template.name]: content }));
            setShowDocs(false);
        } catch (error: any) {
            setErrorByUri(prev => ({ ...prev, [template.name]: error?.message || String(error) }));
        } finally {
            setLoadingByUri(prev => ({ ...prev, [template.name]: false }));
        }
    };

    const renderInteractiveTemplateCard = (template: ResourceTemplate) => {
        const variables = extractVariables(template.uriTemplate);
        const inputs = templateInputs[template.name] || {};
        const uri = buildUri(template);
        const isValidUri = !uri.includes('{');
        const content = contentByUri[template.name];
        const isLoading = loadingByUri[template.name];
        const error = errorByUri[template.name];

        return (
            <Card key={template.name} className="overflow-hidden">
                <Collapsible
                    open={expandedTemplates.has(template.name)}
                    onOpenChange={() => toggleExpandedTemplate(template.name)}
                >
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {expandedTemplates.has(template.name) ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <CardTitle className="text-left">{template.name}</CardTitle>
                                        {template.description && (
                                            <CardDescription className="text-left">
                                                {template.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                </div>
                                <Badge variant="outline">Template</Badge>
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <CardContent className="pt-0">
                            <div className="border-t pt-4 space-y-4">
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

                                {variables.length > 0 && (
                                    <div className="space-y-3">
                                        <span className="font-medium text-muted-foreground">Template Variables:</span>
                                        {variables.map(variable => (
                                            <div key={variable}>
                                                <Label htmlFor={`${template.name}-${variable}`}>
                                                    {variable}
                                                </Label>
                                                <Input
                                                    id={`${template.name}-${variable}`}
                                                    placeholder={`Enter ${variable}...`}
                                                    value={inputs[variable] || ''}
                                                    onChange={(e) => handleInputChange(template.name, variable, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleReadResource(template)}
                                            disabled={!isConnected || !isValidUri || isLoading}
                                            size="sm"
                                        >
                                            {isLoading ? "Reading..." : "Read Resource"}
                                        </Button>
                                        {isValidUri && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(uri, '_blank')}
                                            >
                                                <ExternalLink className="h-4 w-4 mr-1" />
                                                Open URI
                                            </Button>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                            {error}
                                        </div>
                                    )}

                                    {content && (
                                        <div className="space-y-2">
                                            <span className="font-medium text-muted-foreground">Content:</span>
                                            <div className="bg-muted p-3 rounded max-h-96 overflow-auto">
                                                <pre className="text-xs whitespace-pre-wrap">
                                                    {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
        );
    };

    const renderDocsTemplateCard = (template: ResourceTemplate) => {
        const variables = extractVariables(template.uriTemplate);

        return (
            <Card key={template.name}>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                            <CardTitle>{template.name}</CardTitle>
                            {template.description && (
                                <CardDescription>{template.description}</CardDescription>
                            )}
                        </div>
                        <Badge variant="outline" className="ml-auto">Template</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
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

                        {variables.length > 0 && (
                            <div>
                                <span className="font-medium text-muted-foreground">Variables:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {variables.map(variable => (
                                        <Badge key={variable} variant="secondary">{variable}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderDocsList = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Resource Templates</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    {resourceTemplates.length} template{resourceTemplates.length !== 1 ? "s" : ""} available
                </p>

                {resourceTemplates.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h4 className="text-lg font-medium mb-2">No Resource Templates Available</h4>
                            <p className="text-muted-foreground text-center max-w-md">
                                {isConnected
                                    ? "This server doesn't provide any resource templates, or resources are not supported."
                                    : "Connect to an MCP server to view available resource templates."}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {resourceTemplates.map(renderDocsTemplateCard)}
                    </div>
                )}
            </div>
        </div>
    );

    const renderInteractiveList = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowDocs(true)}>Docs</Button>
            </div>

            {resourceTemplates.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-medium mb-2">No Resource Templates Available</h4>
                        <p className="text-muted-foreground text-center max-w-md">
                            {isConnected
                                ? "This server doesn't provide any resource templates, or resources are not supported."
                                : "Connect to an MCP server to view available resource templates."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {resourceTemplates.map(renderInteractiveTemplateCard)}
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
