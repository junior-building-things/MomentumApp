"use client";

import {
  ArrowUpDown,
  CalendarDays,
  CheckCheck,
  CircleAlert,
  Ellipsis,
  Grid2x2,
  LayoutList,
  PencilLine,
  Search,
  Settings2,
  Sparkles,
  TriangleAlert,
  UserRound,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  DashboardData,
  DashboardFeature,
  FeatureFilter,
  FeaturePriority,
  FeatureSort,
  FeatureStatus,
  FeatureViewMode,
} from "@/lib/types";

const statusMeta: Record<
  FeatureStatus,
  {
    label: string;
    className: string;
  }
> = {
  planned: {
    label: "Planned",
    className: "bg-[#eef2ff] text-[#335cff]",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-[#fff4df] text-[#c97a06]",
  },
  launched: {
    label: "Launched",
    className: "bg-[#e8faef] text-[#0d9b4c]",
  },
  at_risk: {
    label: "At Risk",
    className: "bg-[#ffe8ec] text-[#da2648]",
  },
};

const priorityMeta: Record<
  FeaturePriority,
  {
    label: string;
    className: string;
  }
> = {
  low: {
    label: "Low",
    className: "bg-[#f3f5f9] text-[#697386]",
  },
  medium: {
    label: "Medium",
    className: "bg-[#eef2ff] text-[#3653ff]",
  },
  high: {
    label: "High",
    className: "bg-[#111423] text-white",
  },
};

const sortLabel: Record<FeatureSort, string> = {
  due: "Due Date",
  priority: "Priority",
  title: "Title",
};

const filterLabel: Record<FeatureFilter, string> = {
  all: "All Statuses",
  planned: "Planned",
  in_progress: "In Progress",
  launched: "Launched",
  at_risk: "At Risk",
};

function compareByPriority(priority: FeaturePriority) {
  switch (priority) {
    case "high":
      return 0;
    case "medium":
      return 1;
    case "low":
      return 2;
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatSyncLabel(lastSyncedAt: string | null, isLive: boolean) {
  if (!isLive || !lastSyncedAt) {
    return "Preview data";
  }

  return `Synced ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(lastSyncedAt))}`;
}

function getProgress(feature: DashboardFeature) {
  const total = feature.tasks.length;
  const completed = feature.tasks.filter((task) => task.done).length;

  return { total, completed };
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "amber" | "green" | "red";
}) {
  const iconMap = {
    blue: <Workflow className="h-5 w-5" />,
    amber: <CircleAlert className="h-5 w-5" />,
    green: <CheckCheck className="h-5 w-5" />,
    red: <TriangleAlert className="h-5 w-5" />,
  };

  const toneClass = {
    blue: "bg-[#eef3ff] text-[#3167ff]",
    amber: "bg-[#fff2de] text-[#e28709]",
    green: "bg-[#e8f9ef] text-[#0ca553]",
    red: "bg-[#ffe7eb] text-[#e63757]",
  };

  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-white px-6 py-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
            {label}
          </p>
          <p className="mt-3 text-5xl font-semibold tracking-[-0.05em] text-[var(--text)]">
            {value}
          </p>
        </div>
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ${toneClass[tone]}`}
        >
          {iconMap[tone]}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ feature, viewMode }: { feature: DashboardFeature; viewMode: FeatureViewMode }) {
  const status = statusMeta[feature.status];
  const priority = priorityMeta[feature.priority];
  const progress = getProgress(feature);
  const cardLayout =
    viewMode === "grid"
      ? "min-h-[356px] flex-col"
      : "md:min-h-[220px] md:flex-row md:items-start md:gap-6";

  const headerLayout = viewMode === "grid" ? "" : "md:min-w-[320px] md:max-w-[360px]";
  const taskLayout = viewMode === "grid" ? "mt-7" : "mt-7 md:mt-0 md:flex-1";

  return (
    <article
      className={`flex rounded-[30px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)] ${cardLayout}`}
    >
      <div className={`flex-1 ${headerLayout}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[26px] font-semibold tracking-[-0.04em] text-[var(--text)]">
              {feature.title}
            </h3>
            {feature.description ? (
              <p className="mt-3 max-w-[42ch] text-[15px] leading-7 text-[var(--text-muted)]">
                {feature.description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-transparent text-[var(--text-soft)] transition hover:border-[var(--border)] hover:bg-[var(--surface-muted)]"
            aria-label={`Edit ${feature.title}`}
          >
            <PencilLine className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${priority.className}`}>
            {priority.label}
          </span>
          <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${status.className}`}>
            {status.label}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            {feature.owner}
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {formatDate(feature.dueDate)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[var(--text-soft)]">
          <span>{feature.team}</span>
          {feature.meegoState ? (
            <>
              <span className="text-[var(--border-strong)]">•</span>
              <span>{feature.meegoState}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className={taskLayout}>
        <div className="flex items-center justify-between">
          <h4 className="text-[20px] font-semibold tracking-[-0.03em] text-[var(--text)]">Tasks</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-soft)]">
              {progress.completed}/{progress.total}
            </span>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[var(--text-soft)] transition hover:border-[var(--border)] hover:bg-[var(--surface-muted)]"
              aria-label={`More options for ${feature.title}`}
            >
              <Ellipsis className="h-4 w-4" />
            </button>
          </div>
        </div>

        <ul className="mt-5 space-y-4">
          {feature.tasks.map((task) => (
            <li key={task.id} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border ${
                  task.done
                    ? "border-[#111423] bg-[#111423] text-white"
                    : "border-[var(--border-strong)] bg-white text-transparent"
                }`}
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </span>
              <span
                className={`text-[15px] leading-6 ${
                  task.done ? "text-[var(--text)]" : "text-[var(--text-muted)]"
                }`}
              >
                {task.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function DashboardShell({ initialData }: { initialData: DashboardData }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FeatureFilter>("all");
  const [sort, setSort] = useState<FeatureSort>("due");
  const [viewMode, setViewMode] = useState<FeatureViewMode>("grid");
  const [showAddHelp, setShowAddHelp] = useState(false);

  const filteredFeatures = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...initialData.features]
      .filter((feature) => {
        if (filter !== "all" && feature.status !== filter) {
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
      })
      .sort((left, right) => {
        if (sort === "title") {
          return left.title.localeCompare(right.title);
        }

        if (sort === "priority") {
          return compareByPriority(left.priority) - compareByPriority(right.priority);
        }

        return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
      });
  }, [filter, initialData.features, query, sort]);

  return (
    <main className="min-h-screen bg-[var(--app-background)] px-4 py-5 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] rounded-[36px] border border-[var(--border)] bg-[var(--surface-muted)] p-4 sm:p-6">
        <header className="rounded-[30px] bg-white px-6 py-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--accent)] text-white shadow-[0_14px_28px_rgba(91,61,245,0.24)]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-[34px] font-semibold tracking-[-0.05em] text-[var(--text)]">
                  Momentum
                </h1>
                <p className="text-[15px] text-[var(--text-muted)]">
                  Product feature tracker with Meego sync
                </p>
              </div>
            </div>

            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--text-soft)] transition hover:bg-[var(--surface-muted)]"
              aria-label="Dashboard settings"
            >
              <Settings2 className="h-5 w-5" />
            </button>
          </div>

          <section className="mt-6 grid gap-4 xl:grid-cols-4">
            <StatCard label={initialData.summary[0].label} value={initialData.summary[0].value} tone="blue" />
            <StatCard label={initialData.summary[1].label} value={initialData.summary[1].value} tone="amber" />
            <StatCard label={initialData.summary[2].label} value={initialData.summary[2].value} tone="green" />
            <StatCard label={initialData.summary[3].label} value={initialData.summary[3].value} tone="red" />
          </section>

          <section className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center">
            <label className="flex h-14 flex-1 items-center gap-3 rounded-[18px] border border-transparent bg-[var(--surface-muted)] px-4 text-[var(--text-muted)] transition focus-within:border-[var(--border-strong)]">
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search features..."
                className="w-full border-none bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-soft)]"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row xl:flex-nowrap">
              <label className="flex h-14 min-w-[170px] items-center gap-3 rounded-[18px] bg-white px-4 text-[var(--text-muted)] shadow-[var(--shadow-sm)]">
                <Workflow className="h-4 w-4" />
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as FeatureFilter)}
                  className="w-full appearance-none bg-transparent text-[15px] font-medium text-[var(--text)] outline-none"
                >
                  {Object.entries(filterLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex h-14 min-w-[150px] items-center gap-3 rounded-[18px] bg-white px-4 text-[var(--text-muted)] shadow-[var(--shadow-sm)]">
                <ArrowUpDown className="h-4 w-4" />
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as FeatureSort)}
                  className="w-full appearance-none bg-transparent text-[15px] font-medium text-[var(--text)] outline-none"
                >
                  {Object.entries(sortLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex rounded-[18px] bg-[var(--surface-strong)] p-1 text-white shadow-[var(--shadow-sm)]">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex h-12 w-12 items-center justify-center rounded-[14px] transition ${
                    viewMode === "grid" ? "bg-[#1d2134]" : "opacity-70 hover:opacity-100"
                  }`}
                  aria-label="Grid view"
                >
                  <Grid2x2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex h-12 w-12 items-center justify-center rounded-[14px] transition ${
                    viewMode === "list" ? "bg-[#1d2134]" : "opacity-70 hover:opacity-100"
                  }`}
                  aria-label="List view"
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowAddHelp(true)}
                className="inline-flex h-14 items-center justify-center rounded-[18px] bg-[var(--surface-strong)] px-5 text-[15px] font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[#1c2133]"
              >
                Add Feature
              </button>
            </div>
          </section>
        </header>

        <section className="mt-5 flex items-center justify-between px-1">
          <div>
            <p className="text-sm font-medium text-[var(--text-muted)]">
              {filteredFeatures.length} feature{filteredFeatures.length === 1 ? "" : "s"}
            </p>
          </div>
          <p className="text-sm text-[var(--text-soft)]">
            {formatSyncLabel(initialData.lastSyncedAt, initialData.isLive)}
          </p>
        </section>

        <section
          className={`mt-4 grid gap-4 ${
            viewMode === "grid" ? "xl:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {filteredFeatures.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} viewMode={viewMode} />
          ))}
        </section>
      </div>

      {showAddHelp ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#0f122280] p-4">
          <div className="w-full max-w-lg rounded-[30px] bg-white p-7 shadow-[0_28px_70px_rgba(17,19,34,0.18)]">
            <h2 className="text-[28px] font-semibold tracking-[-0.04em] text-[var(--text)]">
              Add Feature
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-[var(--text-muted)]">
              The dashboard layout is ready. To connect a new card to Meego, add its title,
              metadata, and `meegoIssueId` in `src/lib/feature-registry.ts`, then provide the
              Meego API token and project key in your Vercel environment variables.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddHelp(false)}
                className="inline-flex h-12 items-center justify-center rounded-[16px] border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text-muted)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
