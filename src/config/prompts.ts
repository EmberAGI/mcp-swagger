export interface PromptParameter {
  name: string;
  type: "text" | "number" | "email" | "select" | "boolean";
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select type
  description?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  triggerWords: string[];
  template: string; // Template with {parameter} placeholders
  parameters: PromptParameter[];
  category?: string;
  example?: string;
}

export const promptTemplates: PromptTemplate[] = [
  {
    id: "swapTokens",
    name: "Swap Tokens",
    description:
      "Swap tokens between different blockchains with intelligent routing and optimal exchange rates. Supports major tokens across multiple chains with customizable slippage protection.",
    triggerWords: ["swap", "exchange", "trade"],
    template:
      "Swap {fromToken} to {toToken} from {fromChain} to {toChain} using wallet {walletAddress}",
    parameters: [
      {
        name: "walletAddress",
        type: "text",
        placeholder: "Enter walletAddress...",
        required: true,
        description: "The wallet address that will perform the token swap",
      },
      {
        name: "fromToken",
        type: "text",
        placeholder: "Enter fromToken...",
        required: true,
        description: "The token to swap from (source token symbol or name)",
      },
      {
        name: "toToken",
        type: "text",
        placeholder: "Enter toToken...",
        required: true,
        description: "The token to swap to (destination token symbol or name)",
      },
      {
        name: "fromChain",
        type: "text",
        placeholder: "Enter fromChain...",
        required: true,
        description: "The source blockchain network for the token swap",
      },
      {
        name: "toChain",
        type: "text",
        placeholder: "Enter toChain...",
        required: true,
        description: "The destination blockchain network for the token swap",
      },
    ],
    example: "swap USDC to ETH from ethereum to arbitrum using wallet 0x123...",
  },
  {
    id: "perpetualLongPosition",
    name: "Perpetual Long Position",
    description:
      "Enter a leveraged long position in perpetual futures markets. Profit from upward price movements with customizable leverage up to 100x on supported assets like ETH, BTC, and major altcoins.",
    triggerWords: ["long", "perpetual", "leverage"],
    template:
      "Open long position on {market} using {payToken} as payment and {collateralToken} as collateral on {chain} with wallet {walletAddress}",
    parameters: [
      {
        name: "chain",
        type: "text",
        placeholder: "Enter chain...",
        required: true,
        description:
          "The blockchain network where the perpetual position will be created",
      },
      {
        name: "market",
        type: "text",
        placeholder: "Enter market...",
        required: true,
        description:
          "The perpetual futures market to trade (e.g., BTC-USD, ETH-USD)",
      },
      {
        name: "payToken",
        type: "text",
        placeholder: "Enter payToken...",
        required: true,
        description: "The token used to pay for opening the position",
      },
      {
        name: "collateralToken",
        type: "text",
        placeholder: "Enter collateralToken...",
        required: true,
        description: "The token used as collateral for the perpetual position",
      },
      {
        name: "walletAddress",
        type: "text",
        placeholder: "Enter walletAddress...",
        required: true,
        description:
          "The wallet address that will create the perpetual position",
      },
    ],
    example:
      "long position on ETH-USD using USDC as payment and ETH as collateral on arbitrum",
  },
  {
    id: "perpetualShortPosition",
    name: "Perpetual Short Position",
    description:
      "Enter a leveraged short position in perpetual futures markets. Profit from downward price movements with customizable leverage up to 100x on supported assets like ETH, BTC, and major altcoins.",
    triggerWords: ["short", "perpetual", "leverage"],
    template:
      "Open short position on {market} using {payToken} as payment and {collateralToken} as collateral on {chain} with wallet {walletAddress}",
    parameters: [
      {
        name: "chain",
        type: "text",
        placeholder: "Enter chain...",
        required: true,
        description:
          "The blockchain network where the perpetual position will be created",
      },
      {
        name: "market",
        type: "text",
        placeholder: "Enter market...",
        required: true,
        description:
          "The perpetual futures market to trade (e.g., BTC-USD, ETH-USD)",
      },
      {
        name: "payToken",
        type: "text",
        placeholder: "Enter payToken...",
        required: true,
        description: "The token used to pay for opening the position",
      },
      {
        name: "collateralToken",
        type: "text",
        placeholder: "Enter collateralToken...",
        required: true,
        description: "The token used as collateral for the perpetual position",
      },
      {
        name: "walletAddress",
        type: "text",
        placeholder: "Enter walletAddress...",
        required: true,
        description:
          "The wallet address that will create the perpetual position",
      },
    ],
    example:
      "short position on BTC-USD using USDC as payment and BTC as collateral on arbitrum",
  },
  {
    id: "perpetualClose",
    name: "Close Perpetual Position",
    description:
      "Exit existing perpetual futures positions and cancel pending orders. Supports both market and limit orders with configurable position sizing and risk management.",
    triggerWords: ["close", "exit", "perpetual"],
    template:
      "Close {positionSide} position on {market} with {collateralToken} collateral using {providerName} from wallet {walletAddress}",
    parameters: [
      {
        name: "walletAddress",
        type: "text",
        placeholder: "Enter walletAddress...",
        required: true,
        description:
          "The wallet address that owns the perpetual position to close",
      },
      {
        name: "providerName",
        type: "text",
        placeholder: "Enter providerName...",
        required: true,
        description:
          "The DeFi protocol provider where the position exists (e.g., GMX, dYdX)",
      },
      {
        name: "market",
        type: "text",
        placeholder: "Enter market...",
        required: true,
        description: "The perpetual futures market of the position to close",
      },
      {
        name: "collateralToken",
        type: "text",
        placeholder: "Enter collateralToken...",
        required: true,
        description: "The collateral token used in the position",
      },
      {
        name: "positionSide",
        type: "select",
        placeholder: "Enter positionSide...",
        required: true,
        options: ["long", "short"],
        description: "Whether the position is long or short",
      },
      {
        name: "isLimit",
        type: "select",
        placeholder: "Enter isLimit...",
        required: true,
        options: ["true", "false"],
        description:
          "Whether to use limit order ('true') or market order ('false') for closing",
      },
    ],
    example: "close long position on ETH-USD with USDC collateral using GMX",
  },
  {
    id: "lendingSupply",
    name: "Supply to Lending",
    description:
      "Deposit tokens to earn interest and lending rewards across multiple DeFi protocols and chains",
    triggerWords: ["supply", "lend", "deposit"],
    template:
      "Supply {supplyToken} on {supplyChain} using wallet {walletAddress}",
    parameters: [
      {
        name: "walletAddress",
        type: "text",
        placeholder: "Enter walletAddress...",
        required: true,
        description:
          "The wallet address that will supply tokens to the lending protocol",
      },
      {
        name: "supplyToken",
        type: "text",
        placeholder: "Enter supplyToken...",
        required: true,
        description:
          "The token symbol or name to supply to the lending protocol",
      },
      {
        name: "supplyChain",
        type: "text",
        placeholder: "Enter supplyChain...",
        required: true,
        description: "The blockchain network where the lending protocol exists",
      },
    ],
    example: "supply USDC on ethereum using wallet 0x123...",
  },
  {
    id: "lendingBorrow",
    name: "Borrow from Lending",
    description:
      "Access credit by borrowing tokens against your collateral across multiple DeFi protocols and chains",
    triggerWords: ["borrow", "loan", "credit"],
    template:
      "Borrow {borrowToken} on {borrowChain} using wallet {walletAddress}",
    parameters: [
      {
        name: "walletAddress",
        type: "text",
        placeholder: "Enter walletAddress...",
        required: true,
        description:
          "The wallet address that will borrow tokens from the lending protocol",
      },
      {
        name: "borrowToken",
        type: "text",
        placeholder: "Enter borrowToken...",
        required: true,
        description:
          "The token symbol or name to borrow from lending protocols",
      },
      {
        name: "borrowChain",
        type: "text",
        placeholder: "Enter borrowChain...",
        required: true,
        description: "The blockchain network where the borrowing will occur",
      },
    ],
    example: "borrow ETH on ethereum using wallet 0x123...",
  },
  {
    id: "lendingRepay",
    name: "Repay Lending",
    description:
      "Pay back outstanding debt and reduce borrowing positions across multiple DeFi protocols and chains",
    triggerWords: ["repay", "payback", "debt"],
    template: "Repay {repayToken} on {repayChain} using wallet {walletAddress}",
    parameters: [
      {
        name: "walletAddress",
        type: "text",
        placeholder: "Enter walletAddress...",
        required: true,
        description:
          "The wallet address that will repay tokens to the lending protocol",
      },
      {
        name: "repayToken",
        type: "text",
        placeholder: "Enter repayToken...",
        required: true,
        description: "The token symbol or name to repay to lending protocols",
      },
      {
        name: "repayChain",
        type: "text",
        placeholder: "Enter repayChain...",
        required: true,
        description: "The blockchain network where the repayment will occur",
      },
    ],
    example: "repay USDC on ethereum using wallet 0x123...",
  },
  {
    id: "lendingWithdraw",
    name: "Withdraw from Lending",
    description:
      "Redeem your supplied tokens and earned interest from multiple DeFi lending protocols across different blockchains. Access your lending positions and claim accrued rewards.",
    triggerWords: ["withdraw", "redeem", "claim"],
    template:
      "Withdraw {tokenToWithdraw} on {withdrawChain} using wallet {walletAddress}",
    parameters: [
      {
        name: "walletAddress",
        type: "text",
        placeholder: "Enter walletAddress...",
        required: true,
        description:
          "The wallet address that owns the lending positions to withdraw from",
      },
      {
        name: "tokenToWithdraw",
        type: "text",
        placeholder: "Enter tokenToWithdraw...",
        required: true,
        description:
          "The token symbol or name to withdraw from lending protocols",
      },
      {
        name: "withdrawChain",
        type: "text",
        placeholder: "Enter withdrawChain...",
        required: true,
        description: "The blockchain network where the withdrawal will occur",
      },
    ],
    example: "withdraw USDC on ethereum using wallet 0x123...",
  },
  {
    id: "liquiditySupply",
    name: "Supply Liquidity",
    description:
      "Deposit token pairs into liquidity pools to earn trading fees and participate in DeFi protocols",
    triggerWords: ["liquidity", "pool", "LP"],
    template:
      "Supply liquidity with {token0} and {token1} on {supplyChain} using wallet {walletAddress}",
    parameters: [
      {
        name: "walletAddress",
        type: "text",
        placeholder: "Enter walletAddress...",
        required: true,
        description:
          "The wallet address that will supply liquidity to the pool",
      },
      {
        name: "token0",
        type: "text",
        placeholder: "Enter token0...",
        required: true,
        description:
          "The first token in the liquidity pair (token symbol or name)",
      },
      {
        name: "token1",
        type: "text",
        placeholder: "Enter token1...",
        required: true,
        description:
          "The second token in the liquidity pair (token symbol or name)",
      },
      {
        name: "supplyChain",
        type: "text",
        placeholder: "Enter supplyChain...",
        required: true,
        description: "The blockchain network where the liquidity pool exists",
      },
    ],
    example:
      "supply liquidity with USDC and ETH on ethereum using wallet 0x123...",
  },
  {
    id: "liquidityWithdraw",
    name: "Withdraw Liquidity",
    description:
      "Remove liquidity from DeFi pools and claim earned fees. Access your liquidity positions across different protocols and redeem your tokens.",
    triggerWords: ["remove", "withdraw", "liquidity"],
    template:
      "Withdraw {token0}/{token1} liquidity from {providerName} using wallet {walletAddress}",
    parameters: [
      {
        name: "walletAddress",
        type: "text",
        placeholder: "Enter walletAddress...",
        required: true,
        description:
          "The wallet address that owns the liquidity position to withdraw",
      },
      {
        name: "providerName",
        type: "text",
        placeholder: "Enter providerName...",
        required: true,
        description:
          "The DeFi protocol provider where the liquidity position exists (e.g., Uniswap, SushiSwap)",
      },
      {
        name: "token0",
        type: "text",
        placeholder: "Enter token0...",
        required: true,
        description: "The first token in the liquidity pair (token symbol)",
      },
      {
        name: "token1",
        type: "text",
        placeholder: "Enter token1...",
        required: true,
        description: "The second token in the liquidity pair (token symbol)",
      },
    ],
    example: "withdraw USDC/ETH liquidity from Uniswap using wallet 0x123...",
  },
];

export function findPromptByTrigger(text: string): PromptTemplate | null {
  const words = text.toLowerCase().split(" ");
  const firstWord = words[0];

  return (
    promptTemplates.find((template) =>
      template.triggerWords.some(
        (trigger) =>
          trigger.toLowerCase().startsWith(firstWord) ||
          firstWord.startsWith(trigger.toLowerCase())
      )
    ) || null
  );
}

export function getPromptSuggestions(text: string): PromptTemplate[] {
  const query = text.toLowerCase();

  return promptTemplates
    .filter(
      (template) =>
        template.triggerWords.some((trigger) =>
          trigger.toLowerCase().includes(query)
        ) ||
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
    )
    .slice(0, 5);
}
