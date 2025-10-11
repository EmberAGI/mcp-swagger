import { lazy } from "react";

// Dynamic imports for tool components
const toolComponents = {
  Swaps: lazy(() =>
    import("@/components/tools/Swaps").then((m) => ({ default: m.Swaps }))
  ),
  Lending: lazy(() =>
    import("@/components/tools/Lending").then((m) => ({ default: m.Lending }))
  ),
  Liquidity: lazy(() =>
    import("@/components/tools/Liquidity").then((m) => ({
      default: m.Liquidity,
    }))
  ),
  Pendle: lazy(() =>
    import("@/components/tools/Pendle").then((m) => ({ default: m.Pendle }))
  ),
  JsonViewer: lazy(() =>
    import("@/components/tools/JsonViewer").then((m) => ({
      default: m.JsonViewer,
    }))
  ),
  TemplateComponent: lazy(() =>
    import("@/components/tools/TemplateComponent").then((m) => ({
      default: m.TemplateComponent,
    }))
  ),
};

export type ToolComponentName = keyof typeof toolComponents;

export function getToolComponent(componentName: string) {
  const validComponentName = componentName as ToolComponentName;
  return toolComponents[validComponentName] || toolComponents.JsonViewer;
}

export function isValidToolComponent(
  componentName: string
): componentName is ToolComponentName {
  return componentName in toolComponents;
}

// Export available component names for validation
export const availableComponents = Object.keys(
  toolComponents
) as ToolComponentName[];
