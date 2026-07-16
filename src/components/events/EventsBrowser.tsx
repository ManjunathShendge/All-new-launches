"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  CalendarDays,
  CalendarClock,
  Star,
  History,
  CalendarX2,
  PanelLeft,
  PanelLeftClose,
  type LucideIcon,
} from "lucide-react";
import { getEvents } from "@/app/actions/event.actions";
import {
  EventCard as EventCardType,
  EventFilter,
  EventView,
  EVENT_CATEGORIES,
} from "@/types/event";
import EventCard from "./EventCard";
import EventCardSkeleton from "./EventCardSkeleton";

const VIEWS: { id: EventView; label: string; icon: LucideIcon }[] = [
  { id: "upcoming", label: "Upcoming", icon: CalendarDays },
  { id: "week", label: "This Week", icon: CalendarClock },
  { id: "featured", label: "Featured", icon: Star },
  { id: "past", label: "Past", icon: History },
];

type State = {
  view: EventView;
  category: string;
  search: string;
  locality: string;
};

const INITIAL: State = {
  view: "upcoming",
  category: "",
  search: "",
  locality: "",
};

export default function EventsBrowser() {
  const [state, setState] = useState<State>(INITIAL);
  const [collapsed, setCollapsed] = useState(false);
  const [events, setEvents] = useState<EventCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = (s: State) => {
    setLoading(true);
    const filter: EventFilter = {
      when: s.view,
      category: s.category || undefined,
      search: s.search || undefined,
      locality: s.locality || undefined,
    };
    getEvents(filter)
      .then((res) => setEvents(res))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    getEvents({ when: INITIAL.view })
      .then((res) => {
        if (active) setEvents(res);
      })
      .catch(() => {
        if (active) setEvents([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = (patch: Partial<State>, debounce = false) => {
    const next = { ...state, ...patch };
    setState(next);
    if (debounce) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => load(next), 350);
    } else {
      load(next);
    }
  };

  const hasCustomFilters =
    state.category !== "" || state.search !== "" || state.locality !== "";

  const inputClass =
    "rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400";

  return (
    <div className="flex gap-6">
      {/* ---- Collapsible sidebar (desktop) ---- */}
      <aside
        className={`sticky top-18 hidden h-[calc(100vh-4.5rem)] shrink-0 lg:block ${
          collapsed ? "w-16" : "w-52"
        } transition-[width] duration-200`}
      >
        <div className="flex h-full flex-col py-2">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={`mb-2 flex items-center rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 ${
              collapsed ? "justify-center" : ""
            }`}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          <nav className="flex flex-col gap-1">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              const activeView = state.view === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => update({ view: v.id })}
                  title={collapsed ? v.label : undefined}
                  className={`flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    activeView
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{v.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ---- Content ---- */}
      <div className="min-w-0 flex-1">
        {/* Mobile view chips */}
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => update({ view: v.id })}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                state.view === v.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Sticky category pill bar + search */}
        <div className="sticky top-18 z-30 -mx-1 mb-6 bg-white/85 px-1 py-2 backdrop-blur">
          <div className="flex items-center gap-3">
            {/* Pills */}
            <div className="flex flex-1 gap-2 overflow-x-auto">
              <Pill
                active={state.category === ""}
                onClick={() => update({ category: "" })}
              >
                All
              </Pill>
              {EVENT_CATEGORIES.map((c) => (
                <Pill
                  key={c.value}
                  active={state.category === c.value}
                  onClick={() => update({ category: c.value })}
                >
                  {c.label}
                </Pill>
              ))}
            </div>

            {/* Search + locality */}
            <div className="hidden items-center gap-2 sm:flex">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={state.search}
                  onChange={(e) => update({ search: e.target.value }, true)}
                  placeholder="Search"
                  className={`${inputClass} w-40 pl-9`}
                />
              </div>
              <input
                value={state.locality}
                onChange={(e) => update({ locality: e.target.value }, true)}
                placeholder="Locality"
                className={`${inputClass} w-32`}
              />
            </div>
          </div>

          {/* Mobile search */}
          <div className="mt-2 flex gap-2 sm:hidden">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={state.search}
                onChange={(e) => update({ search: e.target.value }, true)}
                placeholder="Search"
                className={`${inputClass} w-full pl-9`}
              />
            </div>
            <input
              value={state.locality}
              onChange={(e) => update({ locality: e.target.value }, true)}
              placeholder="Locality"
              className={`${inputClass} w-28`}
            />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center">
            <CalendarX2 className="h-12 w-12 text-slate-300" strokeWidth={1.5} />
            <h3 className="mt-4 text-lg font-semibold text-slate-800">
              No events found
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {hasCustomFilters
                ? "No events match your filters right now."
                : "There are no events in this view yet. Check back soon."}
            </p>
            {hasCustomFilters && (
              <button
                type="button"
                onClick={() =>
                  update({ category: "", search: "", locality: "" })
                }
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
