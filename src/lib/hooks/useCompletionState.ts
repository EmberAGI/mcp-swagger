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
    ref: ResourceReference | PromptReference,
    argName: string,
    value: string,
    context?: Record<string, string>,
    signal?: AbortSignal
  ) => Promise<string[]>,
  completionsSupported: boolean = true,
  debounceMs: number = 300
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
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
        ref: ResourceReference | PromptReference,
        argName: string,
        value: string,
        context?: Record<string, string>
      ) => {
        if (!completionsSupported) {
          return;
        }

        cleanup();

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

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

          const values = await handleCompletion(
            ref,
            argName,
            value,
            context,
            abortController.signal
          );

          if (!abortController.signal.aborted) {
            setState((prev) => ({
              ...prev,
              completions: { ...prev.completions, [argName]: values },
              loading: { ...prev.loading, [argName]: false },
              errors: { ...prev.errors, [argName]: null },
            }));
          }
        } catch (error) {
          console.error("Completion failed:", error);
          if (!abortController.signal.aborted) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to load suggestions";
            setState((prev) => ({
              ...prev,
              loading: { ...prev.loading, [argName]: false },
              errors: { ...prev.errors, [argName]: errorMessage },
            }));
          }
        } finally {
          if (abortControllerRef.current === abortController) {
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
