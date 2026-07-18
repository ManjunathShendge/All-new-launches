"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { value: string } }) => void;
  /** Classes for the trigger (carry over the old select styling). */
  className?: string;
  wrapperClassName?: string;
  /** Compact/auto-width (filters, pills). Default is full-width (form fields). */
  inline?: boolean;
  /** Open the menu on hover (default true). */
  openOnHover?: boolean;
  disabled?: boolean;
  title?: string;
  name?: string;
  "aria-label"?: string;
  /** <option> (and <optgroup>) elements — parsed into the custom menu. */
  children?: ReactNode;
}

type RawOptionProps = {
  value?: string | number;
  children?: ReactNode;
  disabled?: boolean;
};

// Flatten <option>/<optgroup> children into a plain option list.
function parseOptions(children: ReactNode): Option[] {
  const out: Option[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === "option") {
      const p = child.props as RawOptionProps;
      out.push({
        value: String(p.value ?? ""),
        label: p.children,
        disabled: p.disabled,
      });
    } else if (child.type === "optgroup") {
      const gp = child.props as { children?: ReactNode };
      out.push(...parseOptions(gp.children));
    }
  });
  return out;
}

function nextEnabled(options: Option[], from: number, dir: 1 | -1): number {
  let i = from;
  for (let step = 0; step < options.length; step++) {
    i += dir;
    if (i < 0) i = options.length - 1;
    if (i >= options.length) i = 0;
    if (!options[i]?.disabled) return i;
  }
  return from;
}

/**
 * A custom dropdown that behaves like a <select> (same props) but opens on
 * hover as well as click/keyboard, and animates a chevron tied to its real
 * open state. The menu renders in a portal so it's never clipped by tables or
 * overflow containers.
 */
export default function Select({
  value,
  defaultValue,
  onChange,
  className = "",
  wrapperClassName = "",
  inline = false,
  openOnHover = true,
  disabled = false,
  title,
  name,
  children,
  ...aria
}: SelectProps) {
  const options = useMemo(() => parseOptions(children), [children]);
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(
    defaultValue ?? options[0]?.value ?? ""
  );
  const current = isControlled ? value! : internal;

  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number; width: number } | null>(null);
  const [activeIdx, setActiveIdx] = useState(-1);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected =
    options.find((o) => o.value === current) ?? options[0] ?? null;

  const position = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const estHeight = Math.min(256, options.length * 38 + 8);
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < estHeight + 8 && r.top > spaceBelow;
    setCoords({
      left: r.left,
      top: openUp ? Math.max(8, r.top - estHeight - 4) : r.bottom + 4,
      width: r.width,
    });
  };

  const openMenu = () => {
    if (disabled || options.length === 0) return;
    position();
    setActiveIdx(Math.max(0, options.findIndex((o) => o.value === current)));
    setOpen(true);
  };
  const closeMenu = () => setOpen(false);

  const cancelTimers = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (openTimer.current) clearTimeout(openTimer.current);
  };
  const scheduleClose = () => {
    cancelTimers();
    closeTimer.current = setTimeout(closeMenu, 140);
  };
  const hoverOpen = () => {
    if (!openOnHover) return;
    cancelTimers();
    openTimer.current = setTimeout(openMenu, 120);
  };

  useEffect(() => cancelTimers, []);

  // Keep the menu aligned while open (scroll/resize).
  useEffect(() => {
    if (!open) return;
    const reflow = () => position();
    window.addEventListener("scroll", reflow, true);
    window.addEventListener("resize", reflow);
    return () => {
      window.removeEventListener("scroll", reflow, true);
      window.removeEventListener("resize", reflow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      closeMenu();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const choose = (opt: Option) => {
    if (opt.disabled) return;
    if (!isControlled) setInternal(opt.value);
    onChange?.({ target: { value: opt.value } });
    closeMenu();
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => nextEnabled(options, i, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => nextEnabled(options, i, -1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const o = options[activeIdx];
      if (o) choose(o);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIdx(nextEnabled(options, -1, 1));
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIdx(nextEnabled(options, options.length, -1));
    }
  };

  return (
    <span
      className={`relative items-center ${inline ? "inline-flex" : "flex w-full"} ${wrapperClassName}`}
      onMouseEnter={hoverOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        title={title}
        name={name}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={aria["aria-label"]}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onKeyDown}
        style={{ paddingRight: "2.25rem" }}
        className={`flex items-center text-left ${className}`}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
      </button>

      <ChevronDown
        aria-hidden
        className={`pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-transform duration-200 ${
          open ? "rotate-180" : ""
        }`}
      />

      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            onMouseEnter={cancelTimers}
            onMouseLeave={scheduleClose}
            style={{
              position: "fixed",
              left: coords.left,
              top: coords.top,
              minWidth: coords.width,
              zIndex: 9999,
            }}
            className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-xl shadow-black/10"
          >
            {options.map((o, i) => {
              const isSel = o.value === current;
              const isActive = i === activeIdx && !o.disabled;
              return (
                <div
                  key={`${o.value}-${i}`}
                  role="option"
                  aria-selected={isSel}
                  aria-disabled={o.disabled}
                  onMouseEnter={() => !o.disabled && setActiveIdx(i)}
                  onClick={() => choose(o)}
                  className={`px-3 py-2 ${
                    o.disabled
                      ? "cursor-default text-slate-300"
                      : "cursor-pointer"
                  } ${isActive ? "bg-slate-100" : ""} ${
                    isSel ? "font-semibold text-slate-900" : "text-slate-700"
                  }`}
                >
                  {o.label}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </span>
  );
}
