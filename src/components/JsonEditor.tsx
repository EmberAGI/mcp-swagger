import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

interface JsonEditorProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

const JsonEditor = ({
    value,
    onChange,
    error: externalError,
}: JsonEditorProps) => {
    const [editorContent, setEditorContent] = useState(value || "");
    const [internalError, setInternalError] = useState<string | undefined>(
        undefined,
    );

    useEffect(() => {
        setEditorContent(value || "");
    }, [value]);

    const handleEditorChange = (newContent: string) => {
        setEditorContent(newContent);
        setInternalError(undefined);
        onChange(newContent);
    };

    const displayError = internalError || externalError;

    return (
        <div className="relative">
            <div
                className={`border rounded-md ${displayError
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-800"
                    }`}
            >
                <Textarea
                    value={editorContent}
                    onChange={(e) => handleEditorChange(e.target.value)}
                    className="w-full font-mono text-sm min-h-[100px]"
                    placeholder="Enter JSON..."
                />
            </div>
            {displayError && (
                <p className="text-sm text-red-500 mt-1">{displayError}</p>
            )}
        </div>
    );
};

export default JsonEditor;
