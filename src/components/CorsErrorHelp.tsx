"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Server, Zap } from "lucide-react";

export function CorsErrorHelp() {
    return (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <CardTitle className="text-orange-800 dark:text-orange-200">
                        CORS Error Detected
                    </CardTitle>
                </div>
                <CardDescription className="text-orange-700 dark:text-orange-300">
                    Cross-Origin Resource Sharing (CORS) is blocking the connection to your MCP server.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-orange-800 dark:text-orange-200">What's happening?</h4>
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                                Browsers block direct connections from web apps to external servers for security.
                                This prevents websites from making unauthorized requests to other domains.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-orange-800 dark:text-orange-200">Our Solution</h4>
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                                MCP Swagger includes a built-in proxy server that forwards requests to avoid CORS issues.
                                Your requests are automatically routed through our secure proxy.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Server className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-orange-800 dark:text-orange-200">Alternative Solutions</h4>
                            <div className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">Server-side</Badge>
                                    <span>Add CORS headers to your MCP server</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">Browser</Badge>
                                    <span>Use browser extensions to disable CORS (development only)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">Local</Badge>
                                    <span>Run MCP Inspector locally for direct connections</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-orange-100 dark:bg-orange-900/50 p-3 rounded-md">
                    <p className="text-xs text-orange-700 dark:text-orange-300">
                        <strong>Note:</strong> Our proxy only forwards your requests and doesn't store or log any data.
                        All communication remains between you and your MCP server.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

