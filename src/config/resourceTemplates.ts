/**
 * Resource Template Configuration System
 *
 * This configuration maps MCP resource templates to categories.
 * Resource templates come from the MCP server dynamically, so this config
 * provides category mapping and display information.
 */

export interface ResourceTemplateConfig {
  name: string; // MCP resource template name (must match exactly)
  category: string; // Category ID (must exist in toolCategories)
  enabled: boolean; // Whether template is enabled/visible
}

// Default category for resource templates that don't have a specific mapping
export const defaultResourceTemplateCategory = "wallet";

// Resource template configurations
// Add entries here as resource templates are discovered from the MCP server
export const resourceTemplateConfigs: ResourceTemplateConfig[] = [
  // Example: If there's a blockchain resource template
  // {
  //   name: "blockchain://{chainId}/{address}",
  //   category: "wallet",
  //   enabled: true,
  // },
];

export function getResourceTemplateConfig(
  templateName: string
): ResourceTemplateConfig | undefined {
  return resourceTemplateConfigs.find((config) => config.name === templateName);
}

export function getResourceTemplateCategory(
  templateName: string
): string {
  const config = getResourceTemplateConfig(templateName);
  return config?.category || defaultResourceTemplateCategory;
}

