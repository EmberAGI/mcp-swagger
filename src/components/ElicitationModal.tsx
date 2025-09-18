"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HelpCircle, AlertTriangle } from "lucide-react";
import JsonView from "./JsonView";
import {
    ElicitationResponse,
    PendingElicitationRequest
} from "@/lib/hooks/useMCPConnection";

export type ElicitationModalProps = {
    request: PendingElicitationRequest | null;
    onResolve: (id: number, response: ElicitationResponse) => void;
    onClose: () => void;
};

// Simple schema type for basic validation
interface SchemaProperty {
    type?: string;
    description?: string;
    required?: boolean;
    enum?: any[];
    default?: any;
    format?: string;
}

interface JsonSchema {
    type?: string;
    properties?: Record<string, SchemaProperty>;
    required?: string[];
    title?: string;
    description?: string;
}

const ElicitationModal = ({
    request,
    onResolve,
    onClose,
}: ElicitationModalProps) => {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [validationError, setValidationError] = useState<string | null>(null);
    const [showSchema, setShowSchema] = useState(false);

    const schema = request?.request.requestedSchema as JsonSchema;
    const isOpen = request !== null;

    useEffect(() => {
        if (!request) return;

        // Initialize form data with default values
        const defaultData: Record<string, any> = {};
        if (schema?.properties) {
            Object.entries(schema.properties).forEach(([key, prop]) => {
                if (prop.default !== undefined) {
                    defaultData[key] = prop.default;
                } else if (prop.type === 'string') {
                    defaultData[key] = '';
                } else if (prop.type === 'number' || prop.type === 'integer') {
                    defaultData[key] = 0;
                } else if (prop.type === 'boolean') {
                    defaultData[key] = false;
                } else if (prop.type === 'array') {
                    defaultData[key] = [];
                } else if (prop.type === 'object') {
                    defaultData[key] = {};
                }
            });
        }
        setFormData(defaultData);
        setValidationError(null);
        setShowSchema(false);
    }, [request, schema]);

    const validateFormData = (): boolean => {
        if (!schema) return true;

        // Check required fields
        if (schema.required) {
            for (const field of schema.required) {
                const value = formData[field];
                if (value === undefined || value === null || value === '') {
                    setValidationError(`Required field missing: ${field}`);
                    return false;
                }
            }
        }

        // Check email format
        if (schema.properties) {
            for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
                const value = formData[fieldName];
                if (fieldSchema.format === 'email' && value && typeof value === 'string') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        setValidationError(`Invalid email format: ${fieldName}`);
                        return false;
                    }
                }
            }
        }

        return true;
    };

    const handleFieldChange = (fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        setValidationError(null);
    };

    const handleSubmit = () => {
        if (!request || !validateFormData()) {
            return;
        }

        onResolve(request.id, {
            action: "accept",
            content: formData,
        });
        onClose();
    };

    const handleDecline = () => {
        if (!request) return;
        onResolve(request.id, { action: "decline" });
        onClose();
    };

    const handleCancel = () => {
        if (!request) return;
        onResolve(request.id, { action: "cancel" });
        onClose();
    };

    const renderFormField = (fieldName: string, fieldSchema: SchemaProperty) => {
        const value = formData[fieldName] || '';

        if (fieldSchema.enum && fieldSchema.enum.length > 0) {
            return (
                <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={value}
                    onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                >
                    <option value="">Select {fieldName}...</option>
                    {fieldSchema.enum.map((option: any) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            );
        }

        if (fieldSchema.type === 'boolean') {
            return (
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground">
                        {fieldSchema.description || `Enable ${fieldName}`}
                    </span>
                </div>
            );
        }

        if (fieldSchema.type === 'object' || fieldSchema.type === 'array') {
            return (
                <Textarea
                    placeholder={`Enter JSON for ${fieldName}...`}
                    value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                    onChange={(e) => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            handleFieldChange(fieldName, parsed);
                        } catch {
                            handleFieldChange(fieldName, e.target.value);
                        }
                    }}
                    className="min-h-[100px] font-mono text-sm"
                />
            );
        }

        if (fieldSchema.type === 'number' || fieldSchema.type === 'integer') {
            return (
                <Input
                    type="number"
                    placeholder={`Enter ${fieldName}...`}
                    value={value}
                    onChange={(e) => handleFieldChange(fieldName, Number(e.target.value))}
                />
            );
        }

        // Default to text input
        return (
            <Input
                type={fieldSchema.format === 'email' ? 'email' : 'text'}
                placeholder={fieldSchema.description || `Enter ${fieldName}...`}
                value={value}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            />
        );
    };

    if (!request) return null;

    const schemaTitle = schema?.title || "Information Request";
    const schemaDescription = schema?.description;

    return (
        <Dialog open={isOpen} onOpenChange={() => handleCancel()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-blue-500" />
                        {schemaTitle}
                    </DialogTitle>
                    <DialogDescription>
                        {request.request.message}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {schemaDescription && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{schemaDescription}</AlertDescription>
                        </Alert>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-4">
                        {schema?.properties && Object.entries(schema.properties).map(([fieldName, fieldSchema]) => (
                            <div key={fieldName} className="space-y-2">
                                <Label htmlFor={`field-${fieldName}`} className="flex items-center gap-2">
                                    {fieldName}
                                    {schema.required?.includes(fieldName) && (
                                        <Badge variant="destructive" className="text-xs">required</Badge>
                                    )}
                                    {fieldSchema.type && (
                                        <Badge variant="outline" className="text-xs">{fieldSchema.type}</Badge>
                                    )}
                                </Label>
                                {fieldSchema.description && fieldSchema.type !== 'boolean' && (
                                    <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>
                                )}
                                {renderFormField(fieldName, fieldSchema)}
                            </div>
                        ))}
                    </div>

                    {/* Validation Error */}
                    {validationError && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Validation Error:</strong> {validationError}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Schema Toggle */}
                    <div className="border-t pt-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSchema(!showSchema)}
                            className="mb-2"
                        >
                            {showSchema ? 'Hide' : 'Show'} Schema Details
                        </Button>
                        {showSchema && (
                            <div className="bg-muted p-3 rounded-md">
                                <JsonView data={JSON.stringify(schema, null, 2)} />
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button variant="outline" onClick={handleDecline}>
                            Decline
                        </Button>
                        <Button onClick={handleSubmit}>
                            Submit
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ElicitationModal;
