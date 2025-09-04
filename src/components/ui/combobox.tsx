"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setInputValue(value);
    }, [value]);

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

        // Show dropdown when typing
        if (!open && newValue.length > 0 && options.length > 0) {
            setOpen(true);
        }

        if (onInputChange) {
            onInputChange(newValue);
        }
    };

    const handleSelect = (currentValue: string) => {
        onChange(currentValue);
        setInputValue(currentValue);
        setOpen(false);
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
                                className
                            )}
                            placeholder={placeholder}
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onFocus={() => {
                                if (filteredOptions.length > 0) {
                                    setOpen(true);
                                }
                            }}
                            onKeyDown={handleKeyDown}
                            disabled={disabled}
                        />
                        {options.length > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setOpen(!open);
                                    inputRef.current?.focus();
                                }}
                                disabled={disabled}
                                tabIndex={-1}
                            >
                                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        )}
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
                            <CommandEmpty className="py-2 text-center text-sm">
                                {emptyMessage}
                            </CommandEmpty>
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
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
