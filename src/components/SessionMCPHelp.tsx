"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Key, Info, ExternalLink } from "lucide-react";
import { useState } from "react";

interface SessionMCPHelpProps {
    serverUrl: string;
    onRetryWithSession?: (sessionId: string) => void;
}

export function SessionMCPHelp({ serverUrl, onRetryWithSession }: SessionMCPHelpProps) {
    const [sessionId, setSessionId] = useState("");

    return (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <CardTitle className="text-yellow-800 dark:text-yellow-200">
                        Session-Based MCP Server
                    </CardTitle>
                </div>
                <CardDescription className="text-yellow-700 dark:text-yellow-300">
                    This MCP server requires a session ID for authentication
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <Key className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Authentication Required</h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                The server at <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-xs">{serverUrl}</code>
                                {" "}returned "Invalid or missing session ID". This indicates it uses session-based authentication.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">How to Connect</h4>
                            <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                                <p>Session-based MCP servers typically require:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Initial authentication to obtain a session ID</li>
                                    <li>Including the session ID in subsequent requests</li>
                                    <li>Possible URL format: <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-xs">{serverUrl}?session=YOUR_SESSION_ID</code></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 border-t border-yellow-200 dark:border-yellow-700 pt-4">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Try with Session ID</h4>
                    <div className="space-y-2">
                        <Label htmlFor="session-id" className="text-yellow-700 dark:text-yellow-300">
                            Session ID (if you have one)
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="session-id"
                                placeholder="Enter your session ID..."
                                value={sessionId}
                                onChange={(e) => setSessionId(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                onClick={() => onRetryWithSession?.(sessionId)}
                                disabled={!sessionId.trim()}
                                size="sm"
                            >
                                Retry
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 border-t border-yellow-200 dark:border-yellow-700 pt-4">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Alternative Solutions</h4>
                    <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">Option 1</Badge>
                            <span>Check the server documentation for authentication flow</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">Option 2</Badge>
                            <span>Contact the server administrator for connection details</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">Option 3</Badge>
                            <span>Try a different MCP server that doesn't require sessions</span>
                        </div>
                    </div>
                </div>

                <div className="bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-md">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        <strong>Note:</strong> EmberAI appears to use session-based authentication for their MCP endpoints.
                        You'll need to authenticate first to get a session ID, then use that in your connection URL.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

