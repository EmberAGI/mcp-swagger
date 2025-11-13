"use client";

import Image from "next/image";

interface HeroSectionProps {
  agentReadyActions: number;
  supportedChains: number;
  protocolCategories: number;
}

export function HeroSection({ agentReadyActions, supportedChains, protocolCategories }: HeroSectionProps) {
  return (
    <div className="w-full py-12 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        {/* Branding */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Image src="/logo.svg" alt="EmberAi Logo" width={48} height={48} />
          <div>
            <div className="flex items-center gap-2">
              <Image src="/name.svg" alt="EmberAi" width={144} height={25} />
            </div>
          </div>
        </div>

        {/* Hero Phrase */}
        <h1 className="text-4xl md:text-5xl font-medium mb-4 text-white text-center mx-auto">
          See what Ember can do, for you and your agents
        </h1>

        {/* Subtext */}
        <p className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto text-center">
          Try out our MCP tools in the Playground.<br />
          Act across DeFi with a single remote server.
        </p>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-[#18181B] border border-gray-700 rounded-lg p-6">
            <div className="text-3xl font-bold text-orange-400 mb-2">{agentReadyActions}</div>
            <div className="text-sm text-gray-400">Agent-ready actions</div>
          </div>
          <div className="bg-[#18181B] border border-gray-700 rounded-lg p-6">
            <div className="text-3xl font-bold text-orange-400 mb-2">{supportedChains}</div>
            <div className="text-sm text-gray-400">Supported Chains</div>
          </div>
          <div className="bg-[#18181B] border border-gray-700 rounded-lg p-6">
            <div className="text-3xl font-bold text-orange-400 mb-2">{protocolCategories}</div>
            <div className="text-sm text-gray-400">Protocol categories</div>
          </div>
        </div>
      </div>
    </div>
  );
}

