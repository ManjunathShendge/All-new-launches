"use client";

import { useState } from "react";
import {
  Tag,
  Calendar,
  FileText,
  Users,
  Home,
  Building2,
  Wrench,
  Map,
  House,
  Building,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import {
  PURPOSES,
  CATEGORIES,
  LISTING_TYPES,
  getDisplayCategories,
  isCategoryEnabled,
  needsListingType,
  resolvedListingType,
  getFormFlow,
  PURPOSE_LABEL,
  CATEGORY_LABEL,
  LISTING_TYPE_LABEL,
  type Purpose,
  type Category,
  type ListingType,
  type IconKey,
} from "@/lib/dashboard/wizard.config";
import PropertyFormScaffold from "./PropertyFormScaffold";

const ICONS: Record<IconKey, LucideIcon> = {
  tag: Tag,
  calendar: Calendar,
  file: FileText,
  users: Users,
  home: Home,
  building: Building2,
  wrench: Wrench,
  map: Map,
  single: House,
  project: Building,
};

const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<Category, (typeof CATEGORIES)[number]>;

const STEP_LABELS = ["Purpose", "Category", "Listing Type"] as const;

export default function AddPropertyWizard() {
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [listingType, setListingType] = useState<ListingType | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Which step (1-3) is currently active.
  const step: 1 | 2 | 3 = !purpose ? 1 : !category ? 2 : 3;

  const usesListingType = purpose ? needsListingType(purpose, category) : false;

  // The selection is complete when we have everything the flow requires.
  const isComplete =
    !!purpose &&
    !!category &&
    (!usesListingType || !!listingType);

  const reset = () => {
    setPurpose(null);
    setCategory(null);
    setListingType(null);
    setShowForm(false);
  };

  const selectPurpose = (p: Purpose) => {
    setPurpose(p);
    // Reset downstream choices; keep category only if still valid.
    setCategory((prev) => (prev && isCategoryEnabled(p, prev) ? prev : null));
    setListingType(null);
  };

  const selectCategory = (c: Category) => {
    setCategory(c);
    setListingType(null);
  };

  if (showForm && purpose && category) {
    const resolved = resolvedListingType(purpose, category, listingType);
    return (
      <PropertyFormScaffold
        flow={getFormFlow(purpose, listingType)}
        summary={{
          purpose: PURPOSE_LABEL[purpose],
          category: CATEGORY_LABEL[category],
          listingType: resolved ? LISTING_TYPE_LABEL[resolved] : null,
        }}
        onBack={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Heading */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900">List Your Property</h2>
        <p className="mt-1 text-sm text-slate-500">
          Answer a few questions to get started
        </p>
      </div>

      {/* Stepper */}
      <Stepper step={step} isComplete={isComplete} />

      {/* Step 1 — Purpose */}
      {step === 1 && (
        <>
          <StepTitle>What do you want to do?</StepTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {PURPOSES.map((opt) => (
              <OptionCard
                key={opt.id}
                icon={ICONS[opt.icon]}
                label={opt.label}
                description={opt.description}
                selected={purpose === opt.id}
                onClick={() => selectPurpose(opt.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Step 2 — Category */}
      {step === 2 && purpose && (
        <>
          <StepTitle>What type of property is it?</StepTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {getDisplayCategories().map((catId) => {
              const opt = CATEGORY_BY_ID[catId];
              const enabled = isCategoryEnabled(purpose, catId);
              return (
                <OptionCard
                  key={catId}
                  icon={ICONS[opt.icon]}
                  label={opt.label}
                  description={opt.description}
                  selected={category === catId}
                  disabled={!enabled}
                  onClick={() => enabled && selectCategory(catId)}
                />
              );
            })}
          </div>
          <BackButton onClick={() => setPurpose(null)} />
        </>
      )}

      {/* Step 3 — Listing type / Summary */}
      {step === 3 && purpose && category && (
        <>
          {usesListingType && !isComplete ? (
            <>
              <StepTitle>What are you listing?</StepTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                {LISTING_TYPES.map((opt) => (
                  <ListingTypeCard
                    key={opt.id}
                    icon={ICONS[opt.icon]}
                    label={opt.label}
                    description={opt.description}
                    points={opt.points}
                    selected={listingType === opt.id}
                    onClick={() => setListingType(opt.id)}
                  />
                ))}
              </div>
              <BackButton onClick={() => setCategory(null)} />
            </>
          ) : (
            <Summary
              purpose={PURPOSE_LABEL[purpose]}
              category={CATEGORY_LABEL[category]}
              listingType={(() => {
                const resolved = resolvedListingType(
                  purpose,
                  category,
                  listingType
                );
                return resolved ? LISTING_TYPE_LABEL[resolved] : null;
              })()}
              onReset={reset}
              onContinue={() => setShowForm(true)}
              onBack={() =>
                usesListingType ? setListingType(null) : setCategory(null)
              }
            />
          )}
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Stepper({
  step,
  isComplete,
}: {
  step: 1 | 2 | 3;
  isComplete: boolean;
}) {
  return (
    <div className="mb-10 flex items-center justify-center">
      {STEP_LABELS.map((label, i) => {
        const index = i + 1;
        const done = index < step || (index === step && isComplete);
        const active = index === step && !isComplete;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  done
                    ? "bg-blue-600 text-white"
                    : active
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : index}
              </div>
              <span
                className={`mt-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                  done || active ? "text-blue-700" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {index < STEP_LABELS.length && (
              <div
                className={`mx-2 mb-5 h-0.5 w-12 sm:w-20 ${
                  index < step ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-6 text-center text-lg font-semibold text-slate-900">
      {children}
    </h3>
  );
}

function OptionCard({
  icon: Icon,
  label,
  description,
  selected,
  disabled = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
        disabled
          ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50"
          : selected
            ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
          selected ? "bg-blue-600" : "bg-blue-600/90"
        } text-white`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-slate-900">{label}</span>
        <span className="block text-sm text-slate-500">{description}</span>
      </span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-blue-600 bg-blue-600" : "border-slate-300"
        }`}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </span>
    </button>
  );
}

function ListingTypeCard({
  icon: Icon,
  label,
  description,
  points,
  selected,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  points: string[];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col rounded-xl border p-5 text-left transition-all ${
        selected
          ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
            selected ? "border-blue-600 bg-blue-600" : "border-slate-300"
          }`}
        >
          {selected && <Check className="h-3 w-3 text-white" />}
        </span>
      </div>
      <span className="font-semibold text-slate-900">{label}</span>
      <span className="mt-0.5 text-sm text-slate-500">{description}</span>
      <ul className="mt-3 space-y-1.5">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2 text-sm text-emerald-600">
            <Check className="h-4 w-4 shrink-0" />
            {p}
          </li>
        ))}
      </ul>
    </button>
  );
}

function Summary({
  purpose,
  category,
  listingType,
  onReset,
  onContinue,
  onBack,
}: {
  purpose: string;
  category: string;
  listingType: string | null;
  onReset: () => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-center text-base font-semibold text-slate-900">
        Your Selection
      </h3>

      <div className="mb-6 flex flex-wrap justify-center gap-3">
        <SummaryChip label="Purpose" value={purpose} />
        <SummaryChip label="Category" value={category} />
        {listingType && <SummaryChip label="Listing Type" value={listingType} />}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          Start Over
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Continue to Form
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm">
      <span className="text-slate-500">{label}: </span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>
    </div>
  );
}
