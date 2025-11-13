/**
 * Tool Configuration System
 *
 * This configuration maps MCP tools to UI components and categorizes them.
 * Each tool can specify a custom component for rendering results, otherwise
 * it defaults to JsonViewer.
 *
 * Component mapping is handled by toolComponentLoader.ts which dynamically
 * imports the specified components.
 */

export interface ToolConfig {
  id: string; // MCP tool name (must match exactly)
  name: string; // Display name for UI
  description: string; // Tool description
  category: string; // Category ID (must exist in toolCategories)
  component?: string; // Component name (without .tsx extension), defaults to JsonViewer
  enabled: boolean; // Whether tool is enabled/visible
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  color?: string;
}

export const toolCategories: ToolCategory[] = [
  {
    id: "swapping",
    name: "Swapping",
    description: "Cross-chain token swaps and exchange operations",
    color: "blue",
  },
  {
    id: "perpetuals",
    name: "Perpetuals",
    description: "Leveraged trading with perpetual futures",
    color: "purple",
  },
  {
    id: "lending",
    name: "Lending",
    description: "DeFi lending, borrowing, and yield farming",
    color: "green",
  },
  {
    id: "liquidity",
    name: "Liquidity",
    description: "Liquidity pool management and rewards",
    color: "orange",
  },
  {
    id: "tokenized-yield",
    name: "Tokenized Yield",
    description: "Yield tokenization and fixed-rate markets",
    color: "indigo",
  },
  {
    id: "wallet",
    name: "Wallet",
    description: "Wallet balance and portfolio management",
    color: "gray",
  },
  {
    id: "market-data",
    name: "Market Data",
    description: "Market information and discovery",
    color: "cyan",
  },
];

export const toolConfigs: ToolConfig[] = [
  // Swapping Category
  {
    id: "createSwap",
    name: "Create Swap",
    description:
      "Create a cross-chain token swap transaction plan. Swap tokens from one blockchain to another, supporting both exact input and exact output amounts with customizable slippage tolerance and expiration settings.",
    category: "swapping",
    component: "Swaps",
    enabled: true,
  },
  {
    id: "possibleSwaps",
    name: "Possible Swaps",
    description:
      "Discover available token swap opportunities based on user wallet balances and supported trading pairs. Returns paginated results showing all possible token combinations that can be swapped across different blockchains.",
    category: "swapping",
    enabled: true,
  },

  // Perpetuals Category
  {
    id: "createPerpetualLongPosition",
    name: "Create Perpetual Long Position",
    description:
      "Open a leveraged long position in perpetual futures markets. Bet on price increases with customizable leverage, limit orders, and collateral management across major DeFi protocols like GMX.",
    category: "perpetuals",
    enabled: true,
  },
  {
    id: "possiblePerpetualLongPositions",
    name: "Possible Perpetual Long Positions",
    description:
      "Discover available leveraged long position opportunities based on user wallet balances and supported perpetual markets. Shows available trading pairs, collateral options, and market conditions across DeFi protocols.",
    category: "perpetuals",
    enabled: true,
  },
  {
    id: "createPerpetualShortPosition",
    name: "Create Perpetual Short Position",
    description:
      "Open a leveraged short position in perpetual futures markets. Profit from price declines with customizable leverage, stop-loss orders, and collateral management across major DeFi protocols like GMX.",
    category: "perpetuals",
    enabled: true,
  },
  {
    id: "possiblePerpetualShortPositions",
    name: "Possible Perpetual Short Positions",
    description:
      "Discover available leveraged short position opportunities based on user wallet balances and supported perpetual markets. Shows available shorting pairs, collateral requirements, and borrowing costs across DeFi protocols.",
    category: "perpetuals",
    enabled: true,
  },
  {
    id: "createClosePerpetualsOrders",
    name: "Close Perpetuals Orders",
    description:
      "Close existing perpetual futures positions and cancel pending orders. Manage risk by exiting positions at market prices or using limit orders with customizable slippage protection and partial position sizing.",
    category: "perpetuals",
    enabled: true,
  },
  {
    id: "possibleClosePerpetualsOrders",
    name: "Possible Close Perpetuals Orders",
    description:
      "Discover existing perpetual positions and pending orders that can be closed or cancelled. Shows current positions with unrealized P&L, pending orders with prices, and available exit strategies across DeFi protocols.",
    category: "perpetuals",
    enabled: true,
  },
  {
    id: "getPerpetualsMarkets",
    name: "Get Perpetuals Markets",
    description:
      "Discover available perpetual futures markets across multiple protocols and chains with trading details, liquidity, and leverage options",
    category: "perpetuals",
    enabled: true,
  },
  {
    id: "getPerpetualsPositions",
    name: "Get Perpetuals Positions",
    description:
      "Get comprehensive overview of wallet's active perpetual futures positions including size, PnL, leverage, and liquidation prices across all protocols",
    category: "perpetuals",
    enabled: true,
  },
  {
    id: "getPerpetualsOrders",
    name: "Get Perpetuals Orders",
    description:
      "Get detailed overview of wallet's pending perpetual futures orders including limit orders, stop losses, and take profits across all protocols",
    category: "perpetuals",
    enabled: true,
  },

  // Lending Category
  {
    id: "createLendingSupply",
    name: "Create Lending Supply",
    description:
      "Create a DeFi lending supply transaction plan to deposit tokens and earn yield across multiple protocols",
    category: "lending",
    component: "Lending",
    enabled: true,
  },
  {
    id: "possibleLendingSupply",
    name: "Possible Lending Supply",
    description:
      "Discover available DeFi lending supply opportunities and interest rates across multiple protocols and chains",
    category: "lending",
    enabled: true,
  },
  {
    id: "createLendingBorrow",
    name: "Create Lending Borrow",
    description:
      "Create a DeFi lending borrow transaction plan to access credit using your collateral across multiple protocols",
    category: "lending",
    component: "Lending",
    enabled: true,
  },
  {
    id: "possibleLendingBorrow",
    name: "Possible Lending Borrow",
    description:
      "Discover available DeFi lending borrow opportunities and rates based on your collateral positions across protocols",
    category: "lending",
    enabled: true,
  },
  {
    id: "createLendingRepay",
    name: "Create Lending Repay",
    description:
      "Create a DeFi lending repay transaction plan to pay back borrowed amounts and reduce debt across protocols",
    category: "lending",
    component: "Lending",
    enabled: true,
  },
  {
    id: "possibleLendingRepay",
    name: "Possible Lending Repay",
    description:
      "Discover available DeFi lending repay opportunities based on your outstanding debt positions across protocols",
    category: "lending",
    enabled: true,
  },
  {
    id: "createLendingWithdraw",
    name: "Create Lending Withdraw",
    description:
      "Create a DeFi lending withdraw transaction plan to redeem supplied tokens and claimed earned interest from protocols",
    category: "lending",
    component: "Lending",
    enabled: true,
  },
  {
    id: "possibleLendingWithdraw",
    name: "Possible Lending Withdraw",
    description:
      "Discover available DeFi lending withdraw opportunities based on your supplied positions and accrued interest across protocols",
    category: "lending",
    enabled: true,
  },
  {
    id: "getWalletLendingPositions",
    name: "Get Wallet Lending Positions",
    description:
      "Get comprehensive overview of wallet's DeFi lending positions including supplies, borrows, and earned interest across all protocols",
    category: "lending",
    enabled: true,
  },

  // Liquidity Category
  {
    id: "createLiquiditySupply",
    name: "Create Liquidity Supply",
    description:
      "Create a DeFi liquidity supply transaction plan to deposit tokens into liquidity pools and earn trading fees",
    category: "liquidity",
    component: "Liquidity",
    enabled: true,
  },
  {
    id: "possibleLiquiditySupply",
    name: "Possible Liquidity Supply",
    description:
      "Discover available DeFi liquidity pools and trading fee opportunities across multiple protocols and chains",
    category: "liquidity",
    enabled: true,
  },
  {
    id: "createLiquidityWithdraw",
    name: "Create Liquidity Withdraw",
    description:
      "Withdraw liquidity from a DeFi pool and receive back the token pair",
    category: "liquidity",
    component: "Liquidity",
    enabled: true,
  },
  {
    id: "possibleLiquidityWithdraw",
    name: "Possible Liquidity Withdraw",
    description:
      "Discover existing liquidity positions that can be withdrawn from DeFi pools",
    category: "liquidity",
    enabled: true,
  },
  {
    id: "getLiquidityPools",
    name: "Get Liquidity Pools",
    description: "Gets available liquidity pools",
    category: "liquidity",
    enabled: true,
  },
  {
    id: "getWalletLiquidityPositions",
    name: "Get Wallet Liquidity Positions",
    description: "Gets wallet's liquidity positions",
    category: "liquidity",
    enabled: true,
  },

  // Wallet Category
  {
    id: "getChains",
    name: "Get Chains",
    description: "Gets a list of supported chains",
    category: "wallet",
    enabled: true,
  },
  {
    id: "getTokens",
    name: "Get Tokens",
    description: "Gets a list of supported tokens",
    category: "wallet",
    enabled: true,
  },
  {
    id: "getWalletBalances",
    name: "Get Wallet Balances",
    description: "Gets wallet token balances across multiple chains",
    category: "wallet",
    enabled: true,
  },
];

export function getToolConfig(toolId: string): ToolConfig | undefined {
  return toolConfigs.find((tool) => tool.id === toolId);
}

export function getToolsByCategory(categoryId: string): ToolConfig[] {
  return toolConfigs.filter(
    (tool) => tool.category === categoryId && tool.enabled
  );
}

export function getCategoryConfig(
  categoryId: string
): ToolCategory | undefined {
  return toolCategories.find((cat) => cat.id === categoryId);
}

export function getComponentForTool(toolId: string): string {
  const toolConfig = getToolConfig(toolId);
  return toolConfig?.component || "JsonViewer";
}
