"use client";

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-800 mt-16 bg-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-400">
            EmberAI MCP Explorer v0.16.5
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              hello@emberai.xyz
            </div>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors">
                <span className="text-gray-400 text-xs">×</span>
              </button>
              <button className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors">
                <span className="text-gray-400 text-xs">✈</span>
              </button>
              <button className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors">
                <span className="text-gray-400 text-xs">🎮</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

