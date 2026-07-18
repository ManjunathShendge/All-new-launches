"use client";

import { useState } from "react";
import {
  Inbox,
  Building2,
  BarChart3,
  CalendarDays,
  Store,
  Crown,
  Mail,
  PanelLeftClose,
  PanelLeft,
  type LucideIcon,
} from "lucide-react";
import LeadModeration from "./LeadModeration";
import AdminProperties from "./AdminProperties";
import AdminEvents from "./AdminEvents";
import AdminMarketplace from "./AdminMarketplace";
import AdminPremiumShowcase from "./AdminPremiumShowcase";
import AdminEnquiries from "./AdminEnquiries";
import AdminInsights, { type PropertyStats } from "./AdminInsights";
import type { Lead } from "@/types/lead";
import type { AssignableAgent } from "@/lib/supabase/lead.repository";
import type { AdminPropertyPage } from "@/lib/admin/admin-queries";

type SectionId =
  | "leads"
  | "properties"
  | "showcase"
  | "events"
  | "marketplace"
  | "enquiries"
  | "insights";

const NAV: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "leads", label: "Leads", icon: Inbox },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "showcase", label: "Premium Showcase", icon: Crown },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "marketplace", label: "Marketplace Leads", icon: Store },
  { id: "enquiries", label: "Enquiries", icon: Mail },
  { id: "insights", label: "Insights", icon: BarChart3 },
];

export default function AdminShell({
  leads,
  agents,
  properties,
  propertyStats,
}: {
  leads: Lead[];
  agents: AssignableAgent[];
  properties: AdminPropertyPage;
  propertyStats: PropertyStats;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState<SectionId>("leads");

  const pendingCount = leads.filter((l) => l.approvalStatus === "pending").length;

  return (
    <div className="lg:flex lg:min-h-[calc(100vh-4.5rem)]">
      {/* Sidebar — desktop only */}
      <aside
        className={`sticky top-18 hidden h-[calc(100vh-4.5rem)] shrink-0 border-r border-slate-200 bg-white transition-[width] duration-200 lg:block ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="flex h-full flex-col p-3">
          {/* Header / collapse toggle */}
          <div
            className={`mb-4 flex items-center ${
              collapsed ? "justify-center" : "justify-between"
            }`}
          >
            {!collapsed && (
              <span className="px-2 text-sm font-semibold text-slate-900">
                Admin
              </span>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              title={collapsed ? "Expand" : "Collapse"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeft className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              const badge = item.id === "leads" && pendingCount > 0 ? pendingCount : null;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="relative">
                    <Icon className="h-5 w-5 shrink-0" />
                    {collapsed && badge && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                        {badge}
                      </span>
                    )}
                  </span>
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!collapsed && badge && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1 bg-slate-50/50 p-4 sm:p-6 lg:p-8">
        {/* Mobile nav — horizontal scrollable pills */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            const badge =
              item.id === "leads" && pendingCount > 0 ? pendingCount : null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {badge && (
                  <span
                    className={`rounded-full px-1.5 text-xs font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {active === "leads" && (
          <LeadModeration leads={leads} agents={agents} />
        )}
        {active === "properties" && <AdminProperties initial={properties} />}
        {active === "showcase" && <AdminPremiumShowcase />}
        {active === "events" && <AdminEvents />}
        {active === "marketplace" && <AdminMarketplace />}
        {active === "enquiries" && <AdminEnquiries />}
        {active === "insights" && (
          <AdminInsights
            leads={leads}
            propertyStats={propertyStats}
            agentCount={agents.length}
          />
        )}
      </div>
    </div>
  );
}
