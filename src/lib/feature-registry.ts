import { FeatureDefinition } from "@/lib/types";

export const featureRegistry: FeatureDefinition[] = [
  {
    id: "advanced-search-tags",
    title: "Advanced Search Tags",
    description:
      "Introduce saved filters and richer metadata tags so PMs can segment feature launches faster across teams.",
    team: "Core Search",
    owner: "Jenny Li",
    dueDate: "2026-04-02",
    defaultStatus: "in_progress",
    priority: "high",
    meegoIssueId: "2569106",
    tasks: [
      { id: "tags-taxonomy", label: "Finalize tag taxonomy", done: true },
      { id: "search-qa", label: "Complete search quality QA", done: true },
      { id: "tag-rollout", label: "Prepare staged rollout", done: false },
      { id: "docs", label: "Ship launch notes", done: false },
    ],
  },
  {
    id: "feedback-portal",
    title: "Feedback Portal",
    description:
      "Centralize internal stakeholder requests and customer escalations into a single triage experience for roadmap review.",
    team: "PM Ops",
    owner: "Marcus Tan",
    dueDate: "2026-04-09",
    defaultStatus: "planned",
    priority: "medium",
    meegoIssueId: "2569107",
    tasks: [
      { id: "requirements", label: "Lock request schema", done: true },
      { id: "routing", label: "Define routing logic", done: true },
      { id: "notifications", label: "Connect notifier", done: false },
      { id: "pilot", label: "Start pilot with one team", done: false },
    ],
  },
  {
    id: "ad-rate-experiment",
    title: "Ad Rate Experiment",
    description:
      "Track experiment readiness and review milestones for the next monetization launch with a tighter approval loop.",
    team: "Monetization",
    owner: "Nina Park",
    dueDate: "2026-03-31",
    defaultStatus: "at_risk",
    priority: "high",
    meegoIssueId: "2569108",
    tasks: [
      { id: "eligibility", label: "Complete experiment eligibility checks", done: true },
      { id: "creative", label: "Finalize creative specs", done: true },
      { id: "risk", label: "Close launch risk review", done: false },
      { id: "ops", label: "Confirm support playbook", done: false },
    ],
  },
  {
    id: "analytics-dashboard-redesign",
    title: "Analytics Dashboard Redesign",
    description:
      "Refresh the reporting surface with cleaner KPI cards and better daily trend visibility for cross-functional partners.",
    team: "Insights",
    owner: "Olivia Chen",
    dueDate: "2026-04-12",
    defaultStatus: "planned",
    priority: "medium",
    meegoIssueId: "2569109",
    tasks: [
      { id: "wireframes", label: "Approve revised dashboard wireframes", done: true },
      { id: "tracking", label: "Validate event tracking coverage", done: false },
    ],
  },
  {
    id: "mobile-billing-integration",
    title: "Mobile Billing Integration",
    description:
      "Expose billing status directly in the feature workspace so launches can be coordinated with finance and trust teams.",
    team: "Billing",
    owner: "David Park",
    dueDate: "2026-04-15",
    defaultStatus: "in_progress",
    priority: "low",
    meegoIssueId: "2569110",
    tasks: [
      { id: "mapping", label: "Map billing entities", done: true },
      { id: "sync", label: "Build reconciliation sync", done: true },
    ],
  },
  {
    id: "approval-workflow-automation",
    title: "Approval Workflow Automation",
    description:
      "Automate final launch checks and review sequencing so feature owners spend less time coordinating handoffs.",
    team: "Platform",
    owner: "Tina Xu",
    dueDate: "2026-03-28",
    defaultStatus: "at_risk",
    priority: "medium",
    meegoIssueId: "2569111",
    tasks: [
      { id: "owners", label: "Resolve automation ownership", done: true },
      { id: "handoff", label: "Add handoff escalation rules", done: false },
    ],
  },
];
