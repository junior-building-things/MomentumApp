"use client";

import {
  ArrowUpRight,
  Bolt,
  Check,
  ChevronDown,
  Clock3,
  Flame,
  Grid2x2,
  LayoutList,
  Moon,
  Package,
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
    className: "border-[#343867] bg-[#26294a] text-[#d9dcef]",
  },
  in_progress: {
    className: "border-[#343867] bg-[#26294a] text-[#d9dcef]",
  },
  launched: {
    className: "border-[#0f6b4d] bg-[#0b3b2f] text-[#18e0a2]",
  },
  at_risk: {
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
  p0: {
    label: "P0",
    className: "border-[#a83446] bg-[#371822] text-[#ff7b8f]",
  },
  p1: {
    label: "P1",
    className: "border-[#c45d1c] bg-[#3b210f] text-[#ff9c54]",
  },
  p2: {
    label: "P2",
    className: "border-[#245ede] bg-[#16284c] text-[#65a3ff]",
  },
  p3: {
    label: "P3",
    className: "border-[#46526b] bg-[#252d3c] text-[#aeb7c6]",
  },
  tbd: {
    label: "TBD",
    className: "border-[#555b72] bg-[#262b3c] text-[#c2c7d3]",
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
  p0: "P0",
  p1: "P1",
  p2: "P2",
  p3: "P3",
  tbd: "TBD",
};

function buildFeatureSubtitle(feature: DashboardFeature) {
  return feature.description || [feature.team, feature.meegoState].filter(Boolean).join(" • ");
}

function buildMobilePocLabel(feature: DashboardFeature) {
  const parts = [
    feature.androidPoc ? `Android: ${feature.androidPoc}` : null,
    feature.iosPoc ? `iOS: ${feature.iosPoc}` : null,
  ].filter(Boolean);

  return parts.join(" | ") || "—";
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
    <div className="rounded-[18px] border border-[#25284b] bg-[#161937] px-5 py-4.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#9aa0b6]">{label}</p>
          <p className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.06em] text-white">
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${classes[tone]}`}
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
    <label className="relative flex h-[40px] w-[176px] items-center rounded-[12px] border border-[#292d57] bg-[#161937] px-3 text-white">
      <span className="mr-3 text-[#858ba6]">{icon}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full appearance-none bg-transparent pr-8 text-[13px] font-medium text-white outline-none"
      >
        {(Object.keys(options) as T[]).map((optionValue) => (
          <option key={optionValue} value={optionValue} className="bg-[#161937] text-white">
            {options[optionValue]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 h-4 w-4 text-[#858ba6]" />
    </label>
  );
}

function FeatureRow({ feature }: { feature: DashboardFeature }) {
  const status = statusMeta[feature.status];
  const priority = priorityMeta[feature.priority];
  const featureLink = feature.prdUrl ?? feature.meegoUrl;

  return (
    <article className="grid grid-cols-[minmax(0,2.4fr)_150px_180px_86px_190px_140px] items-center gap-4 border-t border-[#25284b] px-5 py-3.5">
      <div className="min-w-0">
        {featureLink ? (
          <a
            href={featureLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 text-[14px] font-semibold tracking-[-0.04em] text-white transition hover:text-[#cfd5ff]"
          >
            <span className="truncate">{feature.title}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#7f859f]" />
          </a>
        ) : (
          <h3 className="truncate text-[14px] font-semibold tracking-[-0.04em] text-white">
            {feature.title}
          </h3>
        )}
        <p className="mt-1 truncate text-[12px] leading-4 text-[#7f859f]">{buildFeatureSubtitle(feature)}</p>
      </div>

      <div>
        <span
          className={`inline-flex items-center rounded-[8px] border px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
        >
          {feature.currentStatusLabel}
        </span>
      </div>

      <div>
        <p className="truncate text-[12px] text-[#b7bbca]">{feature.businessLine ?? "—"}</p>
      </div>

      <div>
        <span
          className={`inline-flex items-center rounded-[8px] border px-2.5 py-1 text-[11px] font-semibold ${priority.className}`}
        >
          {feature.priorityLabel || priority.label}
        </span>
      </div>

      <div>
        <p className="truncate text-[12px] text-[#b7bbca]">{buildMobilePocLabel(feature)}</p>
      </div>

      <div>
        <p className="truncate text-[12px] text-[#b7bbca]">{feature.serverPoc ?? "—"}</p>
      </div>
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
        feature.iosPoc ?? "",
        feature.androidPoc ?? "",
        feature.serverPoc ?? "",
        feature.team,
        feature.businessLine ?? "",
        feature.priorityLabel,
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
    critical: initialData.features.filter((feature) => feature.priority === "p0").length,
  };

  return (
    <main className="min-h-screen bg-[#0d1023] px-5 py-6 text-white md:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-[min(68vw,1120px)]">
        <header className="mb-6 flex items-start justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#d100ff] via-[#7f1dff] to-[#5b3df5] text-white shadow-[0_18px_40px_rgba(127,29,255,0.35)]">
              <Bolt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-[28px] font-semibold leading-none tracking-[-0.06em] text-white">
                Momentum
              </h1>
              <p className="mt-1 text-[13px] text-[#9aa0b6]">Product Management Dashboard</p>
            </div>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#20254b] text-[#ffd95c]"
            aria-label="Theme"
          >
            <Moon className="h-5 w-5" />
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <SummaryCard label="Total Features" value={summary.total} tone="blue" />
          <SummaryCard label="In Progress" value={summary.inProgress} tone="amber" />
          <SummaryCard label="Launched" value={summary.launched} tone="green" />
          <SummaryCard label="Critical Priority" value={summary.critical} tone="red" />
        </section>

        <section className="mt-6 flex flex-wrap items-center gap-3">
          <label className="flex h-[40px] w-[214px] items-center rounded-[12px] border border-[#292d57] bg-[#161937] px-3 text-[#8b90aa]">
            <Search className="mr-2.5 h-4.5 w-4.5 shrink-0" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search features..."
              className="w-full border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#767d9b]"
            />
          </label>

          <ToolbarSelect
            icon={<SlidersHorizontal className="h-5 w-5" />}
            value={filter}
            onChange={setFilter}
            options={filterLabel}
          />

          <ToolbarSelect
            icon={<SlidersHorizontal className="h-5 w-5" />}
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={priorityFilterLabel}
          />

          <div className="flex h-[40px] items-center overflow-hidden rounded-[12px] border border-[#292d57] bg-[#161937]">
            <button
              type="button"
              className="flex h-full w-[40px] items-center justify-center text-[#747a96]"
              aria-label="Grid view"
            >
              <Grid2x2 className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              className="flex h-full w-[40px] items-center justify-center bg-[#242746] text-white"
              aria-label="List view"
            >
              <LayoutList className="h-4.5 w-4.5" />
            </button>
          </div>

          <button
            type="button"
            className="inline-flex h-[40px] items-center justify-center rounded-[12px] bg-white px-5 text-[13px] font-semibold text-black transition hover:bg-[#f2f3f8]"
          >
            Add Feature
          </button>
        </section>

        <section className="mt-6 overflow-x-auto rounded-[20px] border border-[#25284b] bg-[#161937] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="min-w-[1040px]">
            <div className="grid grid-cols-[minmax(0,2.4fr)_150px_180px_86px_190px_140px] gap-4 px-5 py-3.5 text-[12px] font-semibold text-[#a0a5ba]">
              <div>Feature</div>
              <div>Current Status</div>
              <div>Business Line</div>
              <div>Priority</div>
              <div>Android/iOS POC</div>
              <div>Server POC</div>
            </div>

            {filteredFeatures.length === 0 ? (
              <div className="border-t border-[#25284b] px-7 py-12">
                <h3 className="text-[16px] font-semibold tracking-[-0.04em] text-white">
                  No live Meego stories loaded
                </h3>
                <p className="mt-2 text-[12px] leading-5 text-[#848aa4]">
                  {initialData.loadError ?? "Try changing the filters or search term."}
                </p>
              </div>
            ) : (
              filteredFeatures.map((feature) => <FeatureRow key={feature.id} feature={feature} />)
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
