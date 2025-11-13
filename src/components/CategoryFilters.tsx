"use client";

import { Button } from "@/components/ui/button";
import { Globe, TrendingUp, Droplets, ArrowLeftRight, PiggyBank, Coins } from "lucide-react";

export type CategoryFilter = "all" | "perpetuals" | "liquidity" | "swapping" | "lending" | "tokenized-yield";

interface CategoryFiltersProps {
  activeFilter: CategoryFilter;
  onFilterChange: (filter: CategoryFilter) => void;
}

export function CategoryFilters({ activeFilter, onFilterChange }: CategoryFiltersProps) {
  const filters: { id: CategoryFilter; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All", icon: <Globe className="w-4 h-4" /> },
    { id: "perpetuals", label: "Perpetuals", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "liquidity", label: "Liquidity", icon: <Droplets className="w-4 h-4" /> },
    { id: "swapping", label: "Swaps", icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: "lending", label: "Lending", icon: <PiggyBank className="w-4 h-4" /> },
    { id: "tokenized-yield", label: "Tokenized Yield", icon: <Coins className="w-4 h-4" /> },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? "default" : "outline"}
          onClick={() => onFilterChange(filter.id)}
          className={`flex items-center gap-2 ${
            activeFilter === filter.id
              ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
              : "bg-[#18181B] border-gray-700 text-gray-300 hover:bg-[#18181B]/80"
          }`}
        >
          {filter.icon}
          {filter.label}
        </Button>
      ))}
    </div>
  );
}

