"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";

export type ResourceReference = {
  type: "ref/resource";
  uri: string;
};

export type PromptReference = {
  type: "ref/prompt";
  name: string;
};

export type ToolReference = {
  type: "ref/tool";
  name: string;
};

function debounce<T extends (...args: any[]) => PromiseLike<void>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      void func(...args);
    }, wait);
  };
}

export function useCompletionState(
  handleCompletion: (
    ref: ResourceReference | PromptReference | ToolReference,
    argName: string,
    value: string,
    context?: Record<string, string>,
    signal?: AbortSignal
  ) => Promise<string[]>,
  completionsSupported: boolean = true,
  debounceMs: number = 500
) {
  const [state, setState] = useState<{
    completions: Record<string, string[]>;
    loading: Record<string, boolean>;
    errors: Record<string, string | null>;
  }>({
    completions: {},
    loading: {},
    errors: {},
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    // Just clear the ref without aborting to avoid response reading issues
    abortControllerRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const clearCompletions = useCallback(() => {
    cleanup();
    setState({
      completions: {},
      loading: {},
      errors: {},
    });
  }, [cleanup]);

  const requestCompletions = useMemo(() => {
    return debounce(
      async (
        ref: ResourceReference | PromptReference | ToolReference,
        argName: string,
        value: string,
        context?: Record<string, string>
      ) => {
        if (!completionsSupported) {
          return;
        }

        // Cancel previous request by simply tracking the latest one
        // Don't use AbortController as it interferes with response reading
        const requestId = Date.now();
        cleanup();
        abortControllerRef.current = { requestId } as any;

        setState((prev) => ({
          ...prev,
          loading: { ...prev.loading, [argName]: true },
          errors: { ...prev.errors, [argName]: null },
        }));

        try {
          if (context !== undefined) {
            // Don't include the current field in context
            const contextCopy = { ...context };
            delete contextCopy[argName];
            context = contextCopy;
          }

          // Pass undefined for signal to avoid abort issues
          const values = await handleCompletion(
            ref,
            argName,
            value,
            context,
            undefined
          );

          // Only update state if this is still the latest request
          if (abortControllerRef.current && (abortControllerRef.current as any).requestId === requestId) {
            setState((prev) => ({
              ...prev,
              completions: { ...prev.completions, [argName]: values },
              loading: { ...prev.loading, [argName]: false },
              errors: { ...prev.errors, [argName]: null },
            }));
          }
        } catch (error) {
          // Check if this is a response reading error
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isResponseError = errorMessage.includes("already finished loading") ||
                                 errorMessage.includes("Request with the provided ID") ||
                                 errorMessage.includes("failed to load response data");

          // Only update state if this is still the latest request
          if (abortControllerRef.current && (abortControllerRef.current as any).requestId === requestId) {
            if (isResponseError) {
              // Silently handle response reading errors
              setState((prev) => ({
                ...prev,
                loading: { ...prev.loading, [argName]: false },
                errors: { ...prev.errors, [argName]: null },
              }));
            } else {
              // Only log and show real errors
              console.error("Completion failed:", error);
              setState((prev) => ({
                ...prev,
                loading: { ...prev.loading, [argName]: false },
                errors: { ...prev.errors, [argName]: errorMessage },
              }));
            }
          }
        } finally {
          if (abortControllerRef.current && (abortControllerRef.current as any).requestId === requestId) {
            abortControllerRef.current = null;
          }
        }
      },
      debounceMs
    );
  }, [handleCompletion, completionsSupported, cleanup, debounceMs]);

  // Clear error when user starts typing again
  const clearError = useCallback((argName: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [argName]: null },
    }));
  }, []);

  // Clear completions when support status changes
  useEffect(() => {
    if (!completionsSupported) {
      clearCompletions();
    }
  }, [completionsSupported, clearCompletions]);

  return {
    ...state,
    clearCompletions,
    requestCompletions,
    clearError,
    completionsSupported,
  };
}
