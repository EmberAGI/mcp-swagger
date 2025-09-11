"use client";

import * as React from "react";
import { Check, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps {
    value: string;
    onChange: (value: string) => void;
    onInputChange?: (value: string) => void;
    options?: string[];
    placeholder?: string;
    emptyMessage?: string;
    className?: string;
    id?: string;
    disabled?: boolean;
    maxDisplayedOptions?: number;
    loading?: boolean;
    error?: string | null;
}

export function Combobox({
    value,
    onChange,
    onInputChange,
    options = [],
    placeholder = "Type to search...",
    emptyMessage = "No results found.",
    className,
    id,
    disabled = false,
    maxDisplayedOptions = 10,
    loading = false,
    error = null,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value);
    const [shouldAutoOpen, setShouldAutoOpen] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Auto-open only when we should (after user finishes typing and gets results)
    React.useEffect(() => {
        if (shouldAutoOpen && !open && inputValue.length > 0 && options.length > 0 && !loading) {
            setOpen(true);
            setShouldAutoOpen(false); // Reset flag after opening
        }
    }, [shouldAutoOpen, open, inputValue.length, options.length, loading]);

    // Filter and limit options based on input
    const filteredOptions = React.useMemo(() => {
        if (!inputValue) return options.slice(0, maxDisplayedOptions);

        const filtered = options.filter((option) =>
            option.toLowerCase().includes(inputValue.toLowerCase())
        );

        return filtered.slice(0, maxDisplayedOptions);
    }, [options, inputValue, maxDisplayedOptions]);

    const handleInputChange = (newValue: string) => {
        setInputValue(newValue);
        onChange(newValue);

        // Close dropdown when user starts typing and flag for auto-open when results come
        if (open) {
            setOpen(false);
        }

        // Set flag to auto-open when results arrive (only if user is typing content)
        if (newValue.length > 0) {
            setShouldAutoOpen(true);
        } else {
            setShouldAutoOpen(false);
        }

        if (onInputChange) {
            onInputChange(newValue);
        }
    };

    const handleSelect = (currentValue: string) => {
        setInputValue(currentValue);
        setOpen(false);
        setShouldAutoOpen(false); // Clear auto-open flag when selecting
        onChange(currentValue);
        // Refocus the input after selection
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            setOpen(false);
        } else if (e.key === "ArrowDown" && !open && filteredOptions.length > 0) {
            setOpen(true);
        }
    };

    return (
        <div className="relative w-full">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="relative w-full">
                        <input
                            ref={inputRef}
                            id={id}
                            type="text"
                            className={cn(
                                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                error && "border-destructive focus-visible:ring-destructive",
                                className
                            )}
                            placeholder={placeholder}
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onFocus={() => {
                                // Don't auto-open on focus, let user trigger with button or typing
                            }}
                            onKeyDown={handleKeyDown}
                            disabled={disabled}
                        />
                        <div className="absolute right-0 top-0 h-full flex items-center">
                            {loading && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                            )}
                            {error && !loading && (
                                <AlertCircle className="h-4 w-4 text-destructive mr-2" title={error} />
                            )}
                            {(options.length > 0 || loading) && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-full px-3"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setOpen(!open);
                                        inputRef.current?.focus();
                                    }}
                                    disabled={disabled}
                                    tabIndex={-1}
                                >
                                    <Sparkles className="h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            )}
                        </div>
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    sideOffset={5}
                >
                    <Command shouldFilter={false}>
                        <CommandList>
                            {loading && (
                                <div className="py-3 px-3 text-center">
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                    <div className="text-sm text-muted-foreground">Loading suggestions...</div>
                                </div>
                            )}
                            {error && !loading && (
                                <div className="py-3 px-3 text-center">
                                    <AlertCircle className="h-4 w-4 mx-auto mb-2 text-destructive" />
                                    <div className="text-sm text-destructive">{error}</div>
                                </div>
                            )}
                            {!loading && !error && filteredOptions.length === 0 && inputValue.length > 0 && (
                                <CommandEmpty className="py-2 text-center text-sm">
                                    {emptyMessage}
                                </CommandEmpty>
                            )}
                            {!loading && !error && filteredOptions.length > 0 && (
                                <CommandGroup>
                                    {filteredOptions.map((option, index) => (
                                        <CommandItem
                                            key={`${option}-${index}`}
                                            value={option}
                                            onSelect={() => handleSelect(option)}
                                            className="cursor-pointer"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === option ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <span className="truncate">{option}</span>
                                        </CommandItem>
                                    ))}
                                    {options.length > maxDisplayedOptions && (
                                        <div className="py-2 px-2 text-xs text-muted-foreground text-center border-t">
                                            Showing {filteredOptions.length} of {options.length} options
                                        </div>
                                    )}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && (
                <div className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                </div>
            )}
        </div>
    );
}
