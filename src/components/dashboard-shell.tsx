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
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  DashboardData,
  DashboardFeature,
  FeatureFilter,
  FeaturePriority,
} from "@/lib/types";

const statusMeta = {
  planned: {
    className: "border-[#4d5670] bg-[#252d3c] text-[#cfd6e4]",
  },
  in_progress: {
    className: "border-[#c45d1c] bg-[#3b210f] text-[#ffb580]",
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

function LinkCell({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  if (!href) {
    return <p className="text-[12px] text-[#7f859f]">—</p>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-[12px] font-medium text-[#cfd5ff] transition hover:text-white"
    >
      {label}
    </a>
  );
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
  icon: ReactNode;
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

  return (
    <article className="grid grid-cols-[minmax(0,2.05fr)_126px_160px_82px_86px_100px_120px_110px_190px_140px] items-center gap-4 border-t border-[#25284b] px-5 py-3.5">
      <div className="min-w-0">
        <h3 className="truncate text-[14px] font-semibold tracking-[-0.04em] text-white">
          {feature.title}
        </h3>
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
        <LinkCell href={feature.prdUrl} label="PRD ↗" />
      </div>

      <div>
        <LinkCell href={feature.meegoUrl} label="Meego ↗" />
      </div>

      <div>
        <LinkCell href={feature.complianceUrl} label="Compliance ↗" />
      </div>

      <div>
        <p className="truncate text-[12px] text-[#b7bbca]">{feature.version ?? "—"}</p>
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
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FeatureFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | FeaturePriority>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [priorityInput, setPriorityInput] = useState<FeaturePriority>("p2");
  const [prdUrlInput, setPrdUrlInput] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
        feature.prdUrl ?? "",
        feature.meegoUrl ?? "",
        feature.complianceUrl ?? "",
        feature.version ?? "",
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

  async function handleCreateFeature(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: titleInput,
          priority: priorityInput,
          prdUrl: prdUrlInput,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create the Meego story.");
      }

      setIsCreateOpen(false);
      setTitleInput("");
      setPriorityInput("p2");
      setPrdUrlInput("");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to create the Meego story.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0d1023] px-5 py-6 text-white md:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-[min(82vw,1360px)]">
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
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex h-[40px] items-center justify-center rounded-[12px] bg-white px-5 text-[13px] font-semibold text-black transition hover:bg-[#f2f3f8]"
          >
            Add Feature
          </button>
        </section>

        <section className="mt-6 overflow-x-auto rounded-[20px] border border-[#25284b] bg-[#161937] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="min-w-[1480px]">
            <div className="grid grid-cols-[minmax(0,2.05fr)_126px_160px_82px_86px_100px_120px_110px_190px_140px] gap-4 px-5 py-3.5 text-[12px] font-semibold text-[#a0a5ba]">
              <div>Feature</div>
              <div>Status</div>
              <div>Business Line</div>
              <div>Priority</div>
              <div>PRD</div>
              <div>Meego</div>
              <div>Compliance</div>
              <div>Version</div>
              <div>Android/iOS</div>
              <div>Server</div>
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

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060813]/80 px-4">
          <div className="w-full max-w-[420px] rounded-[20px] border border-[#25284b] bg-[#161937] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.04em] text-white">Add Feature</h2>
                <p className="mt-1 text-[12px] text-[#8f95ad]">
                  Create a new TikTok Meego story and add it to this dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isCreating) {
                    return;
                  }

                  setIsCreateOpen(false);
                  setCreateError(null);
                }}
                className="text-[12px] font-medium text-[#9aa0b6] transition hover:text-white"
              >
                Close
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleCreateFeature}>
              <label className="block">
                <span className="mb-2 block text-[12px] font-medium text-[#aeb4c8]">Title</span>
                <input
                  value={titleInput}
                  onChange={(event) => setTitleInput(event.target.value)}
                  placeholder="Feature title"
                  className="h-[42px] w-full rounded-[12px] border border-[#292d57] bg-[#11142c] px-3 text-[13px] text-white outline-none placeholder:text-[#6f7693]"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[12px] font-medium text-[#aeb4c8]">Priority</span>
                <select
                  value={priorityInput}
                  onChange={(event) => setPriorityInput(event.target.value as FeaturePriority)}
                  className="h-[42px] w-full rounded-[12px] border border-[#292d57] bg-[#11142c] px-3 text-[13px] text-white outline-none"
                >
                  <option value="p0">P0</option>
                  <option value="p1">P1</option>
                  <option value="p2">P2</option>
                  <option value="p3">P3</option>
                  <option value="tbd">TBD</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[12px] font-medium text-[#aeb4c8]">PRD URL</span>
                <input
                  value={prdUrlInput}
                  onChange={(event) => setPrdUrlInput(event.target.value)}
                  placeholder="https://..."
                  className="h-[42px] w-full rounded-[12px] border border-[#292d57] bg-[#11142c] px-3 text-[13px] text-white outline-none placeholder:text-[#6f7693]"
                />
              </label>

              {createError ? (
                <p className="rounded-[12px] border border-[#8a2e41] bg-[#381723] px-3 py-2 text-[12px] text-[#ff9fb1]">
                  {createError}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (isCreating) {
                      return;
                    }

                    setIsCreateOpen(false);
                    setCreateError(null);
                  }}
                  className="inline-flex h-[40px] items-center justify-center rounded-[12px] border border-[#292d57] px-4 text-[13px] font-medium text-[#c8cede] transition hover:bg-[#1a1e3c]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex h-[40px] items-center justify-center rounded-[12px] bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-[#f2f3f8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? "Creating..." : "Create in Meego"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
