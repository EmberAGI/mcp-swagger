"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Keyboard, MousePointer } from "lucide-react";

export default function PromptDemoCard() {
    return (
        <Card className="bg-muted/20 border-muted">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Lightbulb className="h-4 w-4" />
                    Smart Prompt Input
                </CardTitle>
                <CardDescription className="text-xs">
                    Interactive command palette with autocomplete
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <Keyboard className="h-3 w-3 text-muted-foreground mt-0.5" />
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground">Type trigger words:</div>
                            <div className="flex flex-wrap gap-1">
                                {['swap', 'long', 'short', 'supply', 'borrow', 'liquidity'].map(word => (
                                    <Badge key={word} variant="outline" className="text-xs">
                                        {word}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <MousePointer className="h-3 w-3 text-muted-foreground mt-0.5" />
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground">Tab to complete, Enter to submit</div>
                            <div className="text-xs text-muted-foreground">
                                Or click "Prompts" dropdown to browse templates
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-muted pt-2">
                    <div className="text-xs text-muted-foreground">
                        <strong>Try:</strong> "swap USDC to ETH" or "supply USDC on ethereum"
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
