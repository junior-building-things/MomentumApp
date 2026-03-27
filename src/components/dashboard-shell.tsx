"use client";

import {
  Bolt,
  Check,
  ChevronDown,
  Clock3,
  Flame,
  Grid2x2,
  LayoutList,
  Moon,
  Package,
  PencilLine,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  DashboardData,
  DashboardFeature,
  FeatureFilter,
  FeaturePriority,
} from "@/lib/types";

const statusMeta = {
  planned: {
    label: "Planned",
    className: "border-[#343867] bg-[#26294a] text-[#d9dcef]",
  },
  in_progress: {
    label: "Development",
    className: "border-[#343867] bg-[#26294a] text-[#d9dcef]",
  },
  launched: {
    label: "Launched",
    className: "border-[#0f6b4d] bg-[#0b3b2f] text-[#18e0a2]",
  },
  at_risk: {
    label: "At Risk",
    className: "border-[#8a2e41] bg-[#381723] text-[#ff7b98]",
  },
} as const;

const priorityMeta: Record<
  FeaturePriority,
  {
    label: string;
    className: string;
  }
> = {
  low: {
    label: "Low",
    className: "border-[#46526b] bg-[#252d3c] text-[#aeb7c6]",
  },
  medium: {
    label: "Medium",
    className: "border-[#1f5fe0] bg-[#14284f] text-[#5aa1ff]",
  },
  high: {
    label: "High",
    className: "border-[#d45a16] bg-[#3a1d0f] text-[#ff8d47]",
  },
};

const filterLabel: Record<FeatureFilter, string> = {
  all: "All Status",
  planned: "Planned",
  in_progress: "In Progress",
  launched: "Launched",
  at_risk: "At Risk",
};

const priorityFilterLabel: Record<"all" | FeaturePriority, string> = {
  all: "All Priority",
  low: "Low",
  medium: "Medium",
  high: "High",
};

function buildFeatureSubtitle(feature: DashboardFeature) {
  return feature.description || [feature.team, feature.owner, feature.meegoState].filter(Boolean).join(" • ");
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "amber" | "green" | "red";
}) {
  const icons = {
    blue: <Package className="h-7 w-7" />,
    amber: <Clock3 className="h-7 w-7" />,
    green: <Check className="h-7 w-7" />,
    red: <Flame className="h-7 w-7" />,
  };

  const classes = {
    blue: "bg-[#1c2f6a] text-[#c0d4ff]",
    amber: "bg-[#4a251d] text-[#ffd0ba]",
    green: "bg-[#0f3e33] text-[#57f3c1]",
    red: "bg-[#5a1f27] text-[#ff9aa8]",
  };

  return (
    <div className="rounded-[22px] border border-[#25284b] bg-[#161937] px-7 py-7">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[16px] font-medium text-[#9aa0b6]">{label}</p>
          <p className="mt-3 text-[52px] font-semibold leading-none tracking-[-0.06em] text-white">
            {value}
          </p>
        </div>
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ${classes[tone]}`}
        >
          {icons[tone]}
        </div>
      </div>
    </div>
  );
}

function ToolbarSelect<T extends string>({
  icon,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  value: T;
  onChange: (value: T) => void;
  options: Record<T, string>;
}) {
  return (
    <label className="relative flex h-[52px] w-[230px] items-center rounded-[16px] border border-[#292d57] bg-[#161937] px-4 text-white">
      <span className="mr-4 text-[#858ba6]">{icon}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full appearance-none bg-transparent pr-10 text-[16px] font-medium text-white outline-none"
      >
        {(Object.keys(options) as T[]).map((optionValue) => (
          <option key={optionValue} value={optionValue} className="bg-[#161937] text-white">
            {options[optionValue]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-5 h-5 w-5 text-[#858ba6]" />
    </label>
  );
}

function FeatureRow({ feature }: { feature: DashboardFeature }) {
  const status = statusMeta[feature.status];
  const priority = priorityMeta[feature.priority];

  return (
    <article className="grid grid-cols-[minmax(0,1.9fr)_190px_150px_40px] items-center gap-6 border-t border-[#25284b] px-7 py-6">
      <div className="min-w-0">
        <h3 className="text-[18px] font-semibold tracking-[-0.04em] text-white">{feature.title}</h3>
        <p className="mt-1 truncate text-[14px] leading-6 text-[#7f859f]">
          {buildFeatureSubtitle(feature)}
        </p>
      </div>

      <div>
        <span
          className={`inline-flex items-center rounded-[9px] border px-3.5 py-1 text-[15px] font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div>
        <span
          className={`inline-flex items-center rounded-[9px] border px-3.5 py-1 text-[15px] font-semibold ${priority.className}`}
        >
          {priority.label}
        </span>
      </div>

      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-transparent text-[#7f859f] transition hover:border-[#2f335f] hover:bg-[#191c37] hover:text-white"
        aria-label={`Edit ${feature.title}`}
      >
        <PencilLine className="h-4.5 w-4.5" />
      </button>
    </article>
  );
}

export function DashboardShell({ initialData }: { initialData: DashboardData }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FeatureFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | FeaturePriority>("all");

  const filteredFeatures = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return initialData.features.filter((feature) => {
      if (filter !== "all" && feature.status !== filter) {
        return false;
      }

      if (priorityFilter !== "all" && feature.priority !== priorityFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        feature.title,
        feature.description,
        feature.owner,
        feature.team,
        feature.meegoState ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [filter, initialData.features, priorityFilter, query]);

  const summary = {
    total: initialData.features.length,
    inProgress: initialData.features.filter((feature) => feature.status === "in_progress").length,
    launched: initialData.features.filter((feature) => feature.status === "launched").length,
    critical: initialData.features.filter((feature) => feature.priority === "high").length,
  };

  return (
    <main className="min-h-screen bg-[#0d1023] px-6 py-7 text-white md:px-10 lg:px-12">
      <div className="mx-auto w-full max-w-[min(75vw,1536px)]">
        <header className="mb-7 flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#d100ff] via-[#7f1dff] to-[#5b3df5] text-white shadow-[0_18px_40px_rgba(127,29,255,0.35)]">
              <Bolt className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-[34px] font-semibold leading-none tracking-[-0.06em] text-white">
                Momentum
              </h1>
              <p className="mt-1 text-[15px] text-[#9aa0b6]">Product Management Dashboard</p>
            </div>
          </div>

          <button
            type="button"
            className="flex h-13 w-13 items-center justify-center rounded-[16px] bg-[#20254b] text-[#ffd95c]"
            aria-label="Theme"
          >
            <Moon className="h-6 w-6" />
          </button>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          <SummaryCard label="Total Features" value={summary.total} tone="blue" />
          <SummaryCard label="In Progress" value={summary.inProgress} tone="amber" />
          <SummaryCard label="Launched" value={summary.launched} tone="green" />
          <SummaryCard label="Critical Priority" value={summary.critical} tone="red" />
        </section>

        <section className="mt-7 flex flex-wrap items-center gap-4">
          <label className="flex h-[52px] w-[280px] items-center rounded-[16px] border border-[#292d57] bg-[#161937] px-4 text-[#8b90aa]">
            <Search className="mr-4 h-6 w-6 shrink-0" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search features..."
              className="w-full border-none bg-transparent text-[16px] text-white outline-none placeholder:text-[#767d9b]"
            />
          </label>

          <ToolbarSelect
            icon={<SlidersHorizontal className="h-6 w-6" />}
            value={filter}
            onChange={setFilter}
            options={filterLabel}
          />

          <ToolbarSelect
            icon={<SlidersHorizontal className="h-6 w-6" />}
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={priorityFilterLabel}
          />

          <div className="flex h-[52px] items-center overflow-hidden rounded-[16px] border border-[#292d57] bg-[#161937]">
            <button
              type="button"
              className="flex h-full w-[52px] items-center justify-center text-[#747a96]"
              aria-label="Grid view"
            >
              <Grid2x2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="flex h-full w-[52px] items-center justify-center bg-[#242746] text-white"
              aria-label="List view"
            >
              <LayoutList className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            className="inline-flex h-[52px] items-center justify-center rounded-[16px] bg-white px-7 text-[16px] font-semibold text-black transition hover:bg-[#f2f3f8]"
          >
            Add Feature
          </button>
        </section>

        <section className="mt-7 overflow-hidden rounded-[24px] border border-[#25284b] bg-[#161937] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="grid grid-cols-[minmax(0,1.9fr)_190px_150px_40px] gap-6 px-7 py-5 text-[15px] font-semibold text-[#a0a5ba]">
            <div>Feature</div>
            <div>Current Status</div>
            <div>Risk</div>
            <div />
          </div>

          {filteredFeatures.length === 0 ? (
            <div className="border-t border-[#25284b] px-9 py-14">
              <h3 className="text-[22px] font-semibold tracking-[-0.04em] text-white">
                No live Meego stories loaded
              </h3>
              <p className="mt-3 text-[15px] leading-7 text-[#848aa4]">
                {initialData.loadError ?? "Try changing the filters or search term."}
              </p>
            </div>
          ) : (
            filteredFeatures.map((feature) => <FeatureRow key={feature.id} feature={feature} />)
          )}
        </section>
      </div>
    </main>
  );
}
