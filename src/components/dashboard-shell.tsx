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

function formatSyncLabel(lastSyncedAt: string | null, isLive: boolean) {
  if (!isLive || !lastSyncedAt) {
    return "Live Meego data unavailable";
  }

  return `Synced ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(lastSyncedAt))}`;
}

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
    <div className="rounded-[26px] border border-[#25284b] bg-[#161937] px-9 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[19px] font-medium text-[#9aa0b6]">{label}</p>
          <p className="mt-4 text-[68px] font-semibold leading-none tracking-[-0.06em] text-white">
            {value}
          </p>
        </div>
        <div
          className={`flex h-18 w-18 items-center justify-center rounded-full ${classes[tone]}`}
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
    <label className="relative flex h-16 min-w-[290px] items-center rounded-[18px] border border-[#292d57] bg-[#161937] px-5 text-white">
      <span className="mr-4 text-[#858ba6]">{icon}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full appearance-none bg-transparent pr-10 text-[18px] font-medium text-white outline-none"
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
    <article className="grid grid-cols-[minmax(0,1.9fr)_250px_180px_56px] items-center gap-8 border-t border-[#25284b] px-9 py-8">
      <div className="min-w-0">
        <h3 className="text-[24px] font-semibold tracking-[-0.04em] text-white">{feature.title}</h3>
        <p className="mt-2 truncate text-[16px] leading-7 text-[#7f859f]">
          {buildFeatureSubtitle(feature)}
        </p>
      </div>

      <div>
        <span
          className={`inline-flex items-center rounded-[10px] border px-5 py-2 text-[18px] font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div>
        <span
          className={`inline-flex items-center rounded-[10px] border px-5 py-2 text-[18px] font-semibold ${priority.className}`}
        >
          {priority.label}
        </span>
      </div>

      <button
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-transparent text-[#7f859f] transition hover:border-[#2f335f] hover:bg-[#191c37] hover:text-white"
        aria-label={`Edit ${feature.title}`}
      >
        <PencilLine className="h-5 w-5" />
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
    <main className="min-h-screen bg-[#0d1023] px-6 py-8 text-white md:px-10 lg:px-14">
      <div className="mx-auto w-full max-w-[min(75vw,1200px)]">
        <header className="mb-9 flex items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-18 w-18 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#d100ff] via-[#7f1dff] to-[#5b3df5] text-white shadow-[0_18px_40px_rgba(127,29,255,0.35)]">
              <Bolt className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-[44px] font-semibold leading-none tracking-[-0.06em] text-white">
                Momentum
              </h1>
              <p className="mt-2 text-[19px] text-[#9aa0b6]">Product Management Dashboard</p>
            </div>
          </div>

          <button
            type="button"
            className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#20254b] text-[#ffd95c]"
            aria-label="Theme"
          >
            <Moon className="h-8 w-8" />
          </button>
        </header>

        <section className="grid gap-7 md:grid-cols-2">
          <SummaryCard label="Total Features" value={summary.total} tone="blue" />
          <SummaryCard label="In Progress" value={summary.inProgress} tone="amber" />
          <SummaryCard label="Launched" value={summary.launched} tone="green" />
          <SummaryCard label="Critical Priority" value={summary.critical} tone="red" />
        </section>

        <section className="mt-8 flex flex-wrap items-center gap-5">
          <label className="flex h-16 min-w-[340px] flex-1 items-center rounded-[18px] border border-[#292d57] bg-[#161937] px-5 text-[#8b90aa]">
            <Search className="mr-4 h-6 w-6 shrink-0" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search features..."
              className="w-full border-none bg-transparent text-[18px] text-white outline-none placeholder:text-[#767d9b]"
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

          <div className="flex h-16 items-center overflow-hidden rounded-[18px] border border-[#292d57] bg-[#161937]">
            <button
              type="button"
              className="flex h-full w-18 items-center justify-center text-[#747a96]"
              aria-label="Grid view"
            >
              <Grid2x2 className="h-6 w-6" />
            </button>
            <button
              type="button"
              className="flex h-full w-18 items-center justify-center bg-[#242746] text-white"
              aria-label="List view"
            >
              <LayoutList className="h-6 w-6" />
            </button>
          </div>

          <button
            type="button"
            className="inline-flex h-16 items-center justify-center rounded-[18px] bg-white px-9 text-[18px] font-semibold text-black transition hover:bg-[#f2f3f8]"
          >
            Add Feature
          </button>
        </section>

        <section className="mt-8 overflow-hidden rounded-[28px] border border-[#25284b] bg-[#161937] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="grid grid-cols-[minmax(0,1.9fr)_250px_180px_56px] gap-8 px-9 py-7 text-[17px] font-semibold text-[#a0a5ba]">
            <div>Feature</div>
            <div>Current Status</div>
            <div>Risk</div>
            <div />
          </div>

          {filteredFeatures.length === 0 ? (
            <div className="border-t border-[#25284b] px-9 py-14">
              <h3 className="text-[26px] font-semibold tracking-[-0.04em] text-white">
                No live Meego stories loaded
              </h3>
              <p className="mt-3 text-[17px] leading-7 text-[#848aa4]">
                {initialData.loadError ?? "Try changing the filters or search term."}
              </p>
            </div>
          ) : (
            filteredFeatures.map((feature) => <FeatureRow key={feature.id} feature={feature} />)
          )}
        </section>

        <footer className="mt-5 flex items-center justify-between px-1 text-[16px] text-[#7f859f]">
          <p>
            {filteredFeatures.length} feature{filteredFeatures.length === 1 ? "" : "s"}
          </p>
          <p>{formatSyncLabel(initialData.lastSyncedAt, initialData.isLive)}</p>
        </footer>
      </div>
    </main>
  );
}
