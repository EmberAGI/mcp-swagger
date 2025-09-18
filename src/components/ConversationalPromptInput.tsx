"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    ChevronDown,
    Send,
    Wand2,
    Check,
    ArrowRight,
    Loader2
} from 'lucide-react';
import {
    promptTemplates,
    findPromptByTrigger,
    getPromptSuggestions,
    PromptTemplate,
    PromptParameter
} from '@/config/prompts';
import { useCompletionState } from '@/lib/hooks/useCompletionState';

interface ConversationalPromptInputProps {
    onSubmit: (prompt: string, template?: PromptTemplate) => void;
    placeholder?: string;
    className?: string;
    // MCP connection methods for actual execution
    onCallTool?: (name: string, args: Record<string, unknown>) => Promise<any>;
    onGetPrompt?: (name: string, args?: Record<string, string>) => Promise<any>;
    handleCompletion?: (
        ref: { type: "ref/prompt"; name: string },
        argName: string,
        value: string,
        context?: Record<string, string>,
        signal?: AbortSignal
    ) => Promise<string[]>;
    completionsSupported?: boolean;
    isConnected?: boolean;
}

interface ParameterValue {
    [key: string]: string | boolean;
}

export default function ConversationalPromptInput({
    onSubmit,
    placeholder = "Type a command or ask something...",
    className = "",
    onCallTool,
    onGetPrompt,
    handleCompletion,
    completionsSupported = false,
    isConnected = false
}: ConversationalPromptInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [ghostText, setGhostText] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
    const [parameterValues, setParameterValues] = useState<ParameterValue>({});
    const [activeParameterIndex, setActiveParameterIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<PromptTemplate[]>([]);
    const [isPromptDropdownOpen, setIsPromptDropdownOpen] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any>(null);
    const [executionError, setExecutionError] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Completion state for parameter autocomplete
    const { completions, loading, errors, requestCompletions, clearError } = useCompletionState(
        handleCompletion ? (ref: any, argName: string, value: string, context?: Record<string, string>, signal?: AbortSignal) =>
            handleCompletion(ref, argName, value, context, signal) : (async () => []),
        completionsSupported && !!handleCompletion
    );

    // Update suggestions based on input
    useEffect(() => {
        if (inputValue.length > 0 && !selectedTemplate) {
            const newSuggestions = getPromptSuggestions(inputValue);
            setSuggestions(newSuggestions);
            setShowSuggestions(newSuggestions.length > 0);

            // Check for trigger word match
            const matchedTemplate = findPromptByTrigger(inputValue);
            if (matchedTemplate) {
                const remainingText = inputValue.substring(matchedTemplate.triggerWords[0].length);
                setGhostText(matchedTemplate.template.substring(remainingText.length));
            } else {
                setGhostText('');
            }
        } else {
            setShowSuggestions(false);
            setGhostText('');
        }
    }, [inputValue, selectedTemplate]);

    const handleInputChange = (value: string) => {
        if (selectedTemplate) return; // Don't allow editing when template is active
        setInputValue(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab' && ghostText) {
            e.preventDefault();
            activateTemplate();
        } else if (e.key === 'Enter' && !selectedTemplate) {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            clearTemplate();
        }
    };

    const activateTemplate = () => {
        const matchedTemplate = findPromptByTrigger(inputValue);
        if (matchedTemplate) {
            setSelectedTemplate(matchedTemplate);
            setParameterValues({});
            setActiveParameterIndex(0);
            setGhostText('');
            setShowSuggestions(false);
        }
    };

    const selectTemplate = (template: PromptTemplate) => {
        setSelectedTemplate(template);
        setInputValue('');
        setParameterValues({});
        setActiveParameterIndex(0);
        setShowSuggestions(false);
        setIsPromptDropdownOpen(false);
    };

    const clearTemplate = () => {
        setSelectedTemplate(null);
        setParameterValues({});
        setActiveParameterIndex(-1);
        setInputValue('');
        setExecutionResult(null);
        setExecutionError(null);
        inputRef.current?.focus();
    };

    const updateParameter = (paramName: string, value: string | boolean, isSelection: boolean = false) => {
        setParameterValues(prev => ({
            ...prev,
            [paramName]: value
        }));

        // Clear execution results when parameters change
        setExecutionResult(null);
        setExecutionError(null);

        // Request completions if supported and it's a text input
        if (selectedTemplate && handleCompletion && completionsSupported &&
            typeof value === 'string' && value.trim().length > 0 && !isSelection) {
            const context = { ...parameterValues, [paramName]: value };
            requestCompletions(
                {
                    type: "ref/prompt" as const,
                    name: selectedTemplate.id
                },
                paramName,
                value,
                context
            );
        }

        // Clear error when user starts typing
        if (errors[paramName]) {
            clearError(paramName);
        }
    };

    const generateFinalPrompt = (): string => {
        if (!selectedTemplate) return inputValue;

        let result = selectedTemplate.template;
        selectedTemplate.parameters.forEach(param => {
            const value = parameterValues[param.name] || '';
            result = result.replace(`{${param.name}}`, String(value));
        });
        return result;
    };

    const handleSubmit = async () => {
        const finalPrompt = generateFinalPrompt();
        if (!finalPrompt.trim()) return;

        setIsExecuting(true);
        setExecutionError(null);
        setExecutionResult(null);

        try {
            // If we have a selected template and MCP connection, try to execute as MCP prompt or tool
            if (selectedTemplate && isConnected) {
                // Check if this maps to an actual MCP tool (based on the template ID)
                if (onCallTool && (selectedTemplate.id.includes('Token') || selectedTemplate.id.includes('Position') ||
                    selectedTemplate.id.includes('lending') || selectedTemplate.id.includes('liquidity'))) {
                    // This is likely a tool call - convert parameters to tool arguments
                    const toolArgs: Record<string, unknown> = {};
                    selectedTemplate.parameters.forEach(param => {
                        const value = parameterValues[param.name];
                        if (value !== undefined && value !== '') {
                            toolArgs[param.name] = value;
                        }
                    });

                    const result = await onCallTool(selectedTemplate.id, toolArgs);
                    setExecutionResult(result);
                } else if (onGetPrompt) {
                    // This is a prompt - convert parameters to prompt arguments
                    const promptArgs: Record<string, string> = {};
                    selectedTemplate.parameters.forEach(param => {
                        const value = parameterValues[param.name];
                        if (value !== undefined && value !== '') {
                            promptArgs[param.name] = String(value);
                        }
                    });

                    const result = await onGetPrompt(selectedTemplate.id, promptArgs);
                    setExecutionResult(result);
                }
            }

            // Always call the onSubmit handler as well for logging/history
            onSubmit(finalPrompt, selectedTemplate);

            // Don't clear template immediately if we executed successfully - let user see result
            if (!selectedTemplate || !isConnected) {
                clearTemplate();
            }
        } catch (error) {
            console.error('Execution error:', error);
            setExecutionError(error instanceof Error ? error.message : 'Execution failed');

            // Still call onSubmit for logging
            onSubmit(finalPrompt, selectedTemplate);
        } finally {
            setIsExecuting(false);
        }
    };

    const isSubmitReady = () => {
        if (!selectedTemplate) return inputValue.trim().length > 0;

        return selectedTemplate.parameters
            .filter(p => p.required)
            .every(p => parameterValues[p.name] && String(parameterValues[p.name]).trim() !== '');
    };

    const renderParameterInput = (param: PromptParameter, index: number) => {
        const value = parameterValues[param.name] || '';
        const isActive = activeParameterIndex === index;
        const paramCompletions = completions[param.name] || [];
        const isLoadingCompletions = loading[param.name];
        const completionError = errors[param.name];

        if (param.type === 'select') {
            // Merge static options with dynamic completions
            const allOptions = [...(param.options || []), ...paramCompletions.filter(c => !param.options?.includes(c))];

            return (
                <Select
                    key={param.name}
                    value={String(value)}
                    onValueChange={(val) => updateParameter(param.name, val, true)}
                >
                    <SelectTrigger className={`h-8 min-w-[120px] ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
                        <SelectValue placeholder={param.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {allOptions.map(option => (
                            <SelectItem key={option} value={option}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        if (param.type === 'boolean') {
            return (
                <Button
                    key={param.name}
                    variant={value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateParameter(param.name, !value, true)}
                    className={`h-8 ${isActive ? 'ring-2 ring-blue-500' : ''}`}
                >
                    {value ? 'Yes' : 'No'}
                </Button>
            );
        }

        // Text input with completions support
        return (
            <div key={param.name} className="relative">
                <Input
                    type={param.type === 'email' ? 'email' : param.type === 'number' ? 'number' : 'text'}
                    value={String(value)}
                    onChange={(e) => updateParameter(param.name, e.target.value)}
                    placeholder={param.placeholder}
                    className={`h-8 min-w-[100px] ${isActive ? 'ring-2 ring-blue-500' : ''} ${completionError ? 'border-red-500' : ''}`}
                    onFocus={() => setActiveParameterIndex(index)}
                />

                {isLoadingCompletions && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                )}

                {paramCompletions.length > 0 && isActive && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-32 overflow-y-auto">
                        {paramCompletions.slice(0, 5).map((completion, idx) => (
                            <div
                                key={idx}
                                className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-xs"
                                onClick={() => updateParameter(param.name, completion, true)}
                            >
                                {completion}
                            </div>
                        ))}
                    </div>
                )}

                {completionError && (
                    <div className="absolute top-full left-0 mt-1 text-xs text-red-500">
                        {completionError}
                    </div>
                )}
            </div>
        );
    };

    const renderTemplateView = () => {
        if (!selectedTemplate) return null;

        const parts = selectedTemplate.template.split(/(\{[^}]+\})/);

        return (
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-base font-semibold text-blue-700 dark:text-blue-300">
                        <Wand2 className="h-5 w-5" />
                        {selectedTemplate.name}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {parts.map((part, index) => {
                            const paramMatch = part.match(/\{([^}]+)\}/);
                            if (paramMatch) {
                                const paramName = paramMatch[1];
                                const param = selectedTemplate.parameters.find(p => p.name === paramName);
                                if (param) {
                                    const paramIndex = selectedTemplate.parameters.indexOf(param);
                                    return (
                                        <div key={index} className="flex items-center gap-1">
                                            {renderParameterInput(param, paramIndex)}
                                            {param.required && !parameterValues[param.name] && (
                                                <span className="text-red-500 text-sm">*</span>
                                            )}
                                        </div>
                                    );
                                }
                            }
                            return (
                                <span key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                    {part}
                                </span>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        {executionResult && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setExecutionResult(null);
                                    setExecutionError(null);
                                }}
                                className="h-9"
                            >
                                Clear Result
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearTemplate}
                            className="h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!isSubmitReady() || isExecuting}
                            size="sm"
                            className="h-9 min-w-[100px]"
                        >
                            {isExecuting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Executing...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    {isConnected ? 'Execute' : 'Send'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Execution Results */}
                {(executionResult || executionError) && (
                    <div className="p-4 rounded-lg border">
                        {executionError ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-red-600 font-medium">
                                    <span className="text-sm">❌ Execution Error</span>
                                </div>
                                <pre className="text-sm text-red-700 bg-red-50 dark:bg-red-950/20 p-3 rounded overflow-auto">
                                    {executionError}
                                </pre>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-green-600 font-medium">
                                    <span className="text-sm">✅ Execution Result</span>
                                </div>
                                <pre className="text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded overflow-auto max-h-40">
                                    {JSON.stringify(executionResult, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {selectedTemplate ? (
                renderTemplateView()
            ) : (
                <div className="relative">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Input
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                className="h-12 text-lg pr-24 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />

                            {ghostText && (
                                <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                                    <span className="invisible">{inputValue}</span>
                                    <span className="text-gray-400 dark:text-gray-500">
                                        {ghostText}
                                    </span>
                                </div>
                            )}

                            {ghostText && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    <Badge variant="secondary" className="text-xs">
                                        Tab to complete
                                    </Badge>
                                </div>
                            )}
                        </div>

                        <Popover open={isPromptDropdownOpen} onOpenChange={setIsPromptDropdownOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="default" className="shrink-0 h-12">
                                    <Wand2 className="h-5 w-5 mr-2" />
                                    Prompts
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <Command>
                                    <CommandInput placeholder="Search prompts..." />
                                    <CommandList>
                                        <CommandEmpty>No prompts found.</CommandEmpty>
                                        <CommandGroup heading="Available Prompts">
                                            {promptTemplates.map((template) => (
                                                <CommandItem
                                                    key={template.id}
                                                    onSelect={() => selectTemplate(template)}
                                                    className="cursor-pointer"
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{template.name}</span>
                                                            <div className="flex gap-1">
                                                                {template.triggerWords.slice(0, 2).map(word => (
                                                                    <Badge key={word} variant="outline" className="text-xs">
                                                                        {word}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {template.description}
                                                        </span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        <Button
                            onClick={handleSubmit}
                            disabled={!isSubmitReady()}
                            size="default"
                            className="h-12 min-w-[100px]"
                        >
                            <Send className="h-5 w-5 mr-2" />
                            Send
                        </Button>
                    </div>

                    {showSuggestions && suggestions.length > 0 && (
                        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
                            <CardContent className="p-2">
                                <div className="text-xs text-muted-foreground mb-2">Suggestions:</div>
                                {suggestions.map((template) => (
                                    <div
                                        key={template.id}
                                        onClick={() => selectTemplate(template)}
                                        className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{template.name}</div>
                                            <div className="text-xs text-muted-foreground">{template.description}</div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
