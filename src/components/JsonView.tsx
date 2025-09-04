"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JsonViewProps {
    data: any;
    className?: string;
    defaultExpanded?: boolean;
}

export default function JsonView({ data, className, defaultExpanded = true }: JsonViewProps) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleExpanded = (path: string) => {
        setExpanded(prev => ({
            ...prev,
            [path]: !prev[path]
        }));
    };

    const renderValue = (value: any, path: string = "", depth: number = 0): React.ReactNode => {
        if (value === null) return <span className="text-red-500">null</span>;
        if (value === undefined) return <span className="text-gray-500">undefined</span>;

        if (typeof value === "boolean") {
            return <span className={value ? "text-green-500" : "text-red-500"}>{String(value)}</span>;
        }

        if (typeof value === "number") {
            return <span className="text-blue-500">{value}</span>;
        }

        if (typeof value === "string") {
            return <span className="text-green-600">"{value}"</span>;
        }

        if (Array.isArray(value)) {
            const isExpanded = expanded[path] ?? defaultExpanded;

            if (value.length === 0) return <span>[]</span>;

            return (
                <span>
                    <span
                        className="cursor-pointer inline-flex items-center"
                        onClick={() => toggleExpanded(path)}
                    >
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        <span className="text-gray-500">[{value.length}]</span>
                    </span>
                    {isExpanded && (
                        <div className="ml-4">
                            {value.map((item, index) => (
                                <div key={index} className="my-1">
                                    <span className="text-gray-500">{index}:</span> {renderValue(item, `${path}.${index}`, depth + 1)}
                                </div>
                            ))}
                        </div>
                    )}
                </span>
            );
        }

        if (typeof value === "object") {
            const keys = Object.keys(value);
            const isExpanded = expanded[path] ?? defaultExpanded;

            if (keys.length === 0) return <span>{"{}"}</span>;

            return (
                <span>
                    <span
                        className="cursor-pointer inline-flex items-center"
                        onClick={() => toggleExpanded(path)}
                    >
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        <span className="text-gray-500">{`{${keys.length}}`}</span>
                    </span>
                    {isExpanded && (
                        <div className="ml-4">
                            {keys.map(key => (
                                <div key={key} className="my-1">
                                    <span className="text-purple-600">"{key}"</span>: {renderValue(value[key], `${path}.${key}`, depth + 1)}
                                </div>
                            ))}
                        </div>
                    )}
                </span>
            );
        }

        return <span className="text-gray-500">{String(value)}</span>;
    };

    return (
        <div className={cn("relative", className)}>
            <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={handleCopy}
            >
                {copied ? (
                    <>
                        <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                        Copied
                    </>
                ) : (
                    <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                    </>
                )}
            </Button>
            <div className="font-mono text-sm p-4 bg-muted/50 rounded-lg overflow-auto max-h-[500px]">
                {renderValue(data)}
            </div>
        </div>
    );
}
