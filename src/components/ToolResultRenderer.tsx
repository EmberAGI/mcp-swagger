"use client";

import React, { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Code, Loader2 } from 'lucide-react';
import { getToolConfig, getCategoryConfig } from '@/config/tools';
import { getToolComponent } from '@/lib/toolComponentLoader';
import { JsonViewer } from '@/components/tools/JsonViewer';

export interface ToolResultRendererProps {
    toolName: string;
    result: any;
    isLoading?: boolean;
    error?: string | null;
}

export function ToolResultRenderer({
    toolName,
    result,
    isLoading = false,
    error = null
}: ToolResultRendererProps) {
    const [viewMode, setViewMode] = useState<'component' | 'json'>('component');

    const toolConfig = getToolConfig(toolName);
    const categoryConfig = toolConfig ? getCategoryConfig(toolConfig.category) : null;

    // Get the appropriate component
    const componentName = toolConfig?.component || 'JsonViewer';
    const ToolComponent = getToolComponent(componentName);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Executing {toolConfig?.name || toolName}...
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="text-muted-foreground">Processing your request...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <span className="text-red-500">❌</span>
                        Error: {toolConfig?.name || toolName}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                            {error}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!result) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{toolConfig?.name || toolName}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-muted-foreground">No result data available</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle>{toolConfig?.name || toolName}</CardTitle>
                        {categoryConfig && (
                            <Badge
                                variant="secondary"
                                className="text-xs"
                                style={{
                                    backgroundColor: categoryConfig.color ? `var(--${categoryConfig.color}-100)` : undefined,
                                    color: categoryConfig.color ? `var(--${categoryConfig.color}-700)` : undefined
                                }}
                            >
                                {categoryConfig.name}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant={viewMode === 'component' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('component')}
                            className="h-8"
                        >
                            <Eye className="h-3 w-3 mr-1" />
                            Component
                        </Button>
                        <Button
                            variant={viewMode === 'json' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('json')}
                            className="h-8"
                        >
                            <Code className="h-3 w-3 mr-1" />
                            JSON
                        </Button>
                    </div>
                </div>

                {toolConfig?.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {toolConfig.description}
                    </p>
                )}
            </CardHeader>

            <CardContent>
                {viewMode === 'json' ? (
                    <JsonViewer
                        data={result}
                        title={`${toolConfig?.name || toolName} Result`}
                    />
                ) : (
                    <Suspense
                        fallback={
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                <span className="text-muted-foreground">Loading component...</span>
                            </div>
                        }
                    >
                        <ErrorBoundary
                            fallback={
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 mb-2">
                                        <span>⚠️</span>
                                        <span className="font-medium">Component Error</span>
                                    </div>
                                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
                                        The custom component failed to render. Showing JSON view instead.
                                    </p>
                                    <JsonViewer
                                        data={result}
                                        title={`${toolConfig?.name || toolName} Result (Fallback)`}
                                    />
                                </div>
                            }
                        >
                            <ToolComponent
                                {...(componentName === 'JsonViewer' ? { data: result } : result)}
                            />
                        </ErrorBoundary>
                    </Suspense>
                )}
            </CardContent>
        </Card>
    );
}

// Error Boundary Component
interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Tool component error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }

        return this.props.children;
    }
}
