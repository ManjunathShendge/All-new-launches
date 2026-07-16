"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { FormFlow } from "@/lib/dashboard/wizard.config";

interface Summary {
  purpose: string;
  category: string;
  listingType: string | null;
}

/**
 * Multi-step property form shell. The step structure comes from the product
 * spec; the per-step field requirements are being finalized separately, so each
 * step currently renders a placeholder. Wire real fields into `renderStep()`.
 */
export default function PropertyFormScaffold({
  flow,
  summary,
  onBack,
}: {
  flow: FormFlow;
  summary: Summary;
  onBack: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const last = flow.steps.length - 1;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Heading + selection recap */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900">{flow.title} Form</h2>
        <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {summary.purpose}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {summary.category}
          </span>
          {summary.listingType && (
            <span className="rounded-full bg-slate-100 px-3 py-1">
              {summary.listingType}
            </span>
          )}
        </div>
      </div>

      {/* Step rail — icon on top, label below, connectors between icons */}
      <div className="mb-8 flex items-start justify-start overflow-x-auto pb-1 sm:justify-center">
        {flow.steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={label} className="flex items-start">
              <button
                type="button"
                onClick={() => setCurrent(i)}
                className="flex w-16 flex-col items-center gap-1.5 sm:w-20"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done || active
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={`text-center text-[11px] leading-tight ${
                    done || active ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </button>
              {i < flow.steps.length - 1 && (
                <div
                  className={`mt-4 h-0.5 w-4 shrink-0 sm:w-6 ${
                    i < current ? "bg-blue-600" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step body */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <h3 className="text-lg font-semibold text-slate-900">
          {flow.steps[current]}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Step {current + 1} of {flow.steps.length}
        </p>

        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-sm text-slate-500">
            Fields for <span className="font-medium">{flow.steps[current]}</span>{" "}
            will be added here.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            (Field-level requirements are being finalized.)
          </p>
        </div>

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => (current === 0 ? onBack() : setCurrent(current - 1))}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            {current === 0 ? "Back to Selection" : "Previous"}
          </button>

          {current < last ? (
            <button
              type="button"
              onClick={() => setCurrent(current + 1)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              title="Submission will be enabled once form fields are finalized"
              className="cursor-not-allowed rounded-lg bg-slate-300 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Submit Property
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
