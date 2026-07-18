"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, Loader2, Building2, MapPin, Navigation } from "lucide-react";
import { getSearchSuggestions } from "@/lib/actions/property-search.action";
import {
  EMPTY_SUGGESTIONS,
  type SearchSuggestions,
  type PropertySuggestion,
} from "@/types/property-search";

type Item =
  | { kind: "query"; label: string }
  | { kind: "property"; data: PropertySuggestion }
  | { kind: "locality"; value: string }
  | { kind: "city"; value: string };

export default function PropertySearchBar({
  scope,
  placeholder = "Search by project, locality or city…",
}: {
  scope?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("search") ?? "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sugg, setSugg] = useState<SearchSuggestions>(EMPTY_SUGGESTIONS);
  const [active, setActive] = useState(-1);

  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced suggestion fetch. All setState happens inside the timeout
  // callback (async) so it's never a synchronous set-state in the effect body.
  useEffect(() => {
    const term = q.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      async () => {
        if (term.length < 2) {
          setSugg(EMPTY_SUGGESTIONS);
          setLoading(false);
          return;
        }
        setLoading(true);
        const res = await getSearchSuggestions(term, scope);
        setSugg(res);
        setLoading(false);
      },
      term.length < 2 ? 0 : 250
    );
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, scope]);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Flat, keyboard-navigable item list (mirrors render order).
  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    if (q.trim().length >= 2) list.push({ kind: "query", label: q.trim() });
    sugg.properties.forEach((p) => list.push({ kind: "property", data: p }));
    sugg.localities.forEach((v) => list.push({ kind: "locality", value: v }));
    sugg.cities.forEach((v) => list.push({ kind: "city", value: v }));
    return list;
  }, [q, sugg]);

  const pushWith = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    params.delete("page"); // any new query/filter resets to page 1
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const runSearch = (term: string) => {
    setOpen(false);
    pushWith({ search: term.trim() || null });
  };

  const select = (item: Item) => {
    setOpen(false);
    if (item.kind === "query") return runSearch(item.label);
    if (item.kind === "property") {
      router.push(`/properties/${item.data.slug}`);
      return;
    }
    if (item.kind === "locality") {
      setQ(item.value);
      pushWith({ locality: item.value, search: null });
      return;
    }
    // city
    setQ(item.value);
    pushWith({ city: item.value, search: null });
  };

  const clear = () => {
    setQ("");
    setSugg(EMPTY_SUGGESTIONS);
    setActive(-1);
    if (searchParams.get("search")) pushWith({ search: null });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (items.length ? (i + 1) % items.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (items.length ? (i - 1 + items.length) % items.length : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && items[active]) select(items[active]);
      else runSearch(q);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const hasResults =
    sugg.properties.length + sugg.localities.length + sugg.cities.length > 0;

  return (
    <div ref={boxRef} className="relative w-full">
      {/* Input */}
      <div className="flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface-container-lowest) px-3.5 py-2.5 shadow-sm transition focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/20">
        <Search size={18} className="shrink-0 text-muted" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search properties"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
        />
        {loading && <Loader2 size={16} className="shrink-0 animate-spin text-muted" />}
        {q && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="shrink-0 rounded-full p-1 text-muted transition-colors hover:bg-(--surface-container-high) hover:text-foreground"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Mega dropdown */}
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-auto rounded-2xl border border-(--border) bg-(--surface-container-lowest) py-2 shadow-xl shadow-black/10">
          {/* Search-for row */}
          <Row
            active={active === 0}
            onClick={() => runSearch(q)}
            onHover={() => setActive(0)}
            icon={<Search size={16} className="text-[#2563EB]" />}
          >
            Search for{" "}
            <span className="font-semibold text-foreground">
              &ldquo;{q.trim()}&rdquo;
            </span>
          </Row>

          {loading && !hasResults && (
            <p className="px-4 py-6 text-center text-sm text-muted">Searching…</p>
          )}

          {!loading && !hasResults && (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No matches. Press Enter to search anyway.
            </p>
          )}

          <Group title="Properties" show={sugg.properties.length > 0}>
            {sugg.properties.map((p, i) => {
              const idx = 1 + i;
              return (
                <Row
                  key={p.id}
                  active={active === idx}
                  onClick={() => select({ kind: "property", data: p })}
                  onHover={() => setActive(idx)}
                  icon={<Building2 size={16} className="text-slate-400" />}
                >
                  <span className="block truncate font-medium text-foreground">
                    {p.title}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {[p.locality, p.city].filter(Boolean).join(", ") || "View listing"}
                  </span>
                </Row>
              );
            })}
          </Group>

          <Group title="Localities" show={sugg.localities.length > 0}>
            {sugg.localities.map((v, i) => {
              const idx = 1 + sugg.properties.length + i;
              return (
                <Row
                  key={v}
                  active={active === idx}
                  onClick={() => select({ kind: "locality", value: v })}
                  onHover={() => setActive(idx)}
                  icon={<MapPin size={16} className="text-slate-400" />}
                >
                  <span className="font-medium text-foreground">{v}</span>
                  <span className="ml-2 text-xs text-muted">Locality</span>
                </Row>
              );
            })}
          </Group>

          <Group title="Cities" show={sugg.cities.length > 0}>
            {sugg.cities.map((v, i) => {
              const idx = 1 + sugg.properties.length + sugg.localities.length + i;
              return (
                <Row
                  key={v}
                  active={active === idx}
                  onClick={() => select({ kind: "city", value: v })}
                  onHover={() => setActive(idx)}
                  icon={<Navigation size={16} className="text-slate-400" />}
                >
                  <span className="font-medium text-foreground">{v}</span>
                  <span className="ml-2 text-xs text-muted">City</span>
                </Row>
              );
            })}
          </Group>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- primitives ------------------------------- */

function Group({
  title,
  show,
  children,
}: {
  title: string;
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="mt-1 border-t border-(--border) pt-1 first:mt-0 first:border-t-0 first:pt-0">
      <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({
  active,
  onClick,
  onHover,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  onHover: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep input focus
      onClick={onClick}
      onMouseEnter={onHover}
      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
        active ? "bg-[#2563EB]/8" : "hover:bg-(--surface-container-high)"
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--surface-container-high)">
        {icon}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}
