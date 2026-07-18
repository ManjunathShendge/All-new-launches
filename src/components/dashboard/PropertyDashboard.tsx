"use client";

import { useState } from "react";
import LeadsTable from "./LeadsTable";
import MyListings from "./MyListings";
import AddPropertyWizard from "./AddPropertyWizard";
import ProfileForm from "./ProfileForm";
import type { MyListing } from "@/lib/actions/listing.action";
import type { Lead } from "@/types/lead";
import type { EditableProfile } from "@/lib/actions/profile.action";

type TabId = "listings" | "leads" | "add" | "profile";

const TABS: { id: TabId; label: string }[] = [
  { id: "listings", label: "My Listings" },
  { id: "leads", label: "My Leads" },
  { id: "add", label: "Add New Property" },
  { id: "profile", label: "Profile" },
];

export default function PropertyDashboard({
  listings,
  leads,
  fullName,
  profile,
}: {
  listings: MyListing[];
  leads: Lead[];
  fullName: string | null;
  profile: EditableProfile | null;
}) {
  const [tab, setTab] = useState<TabId>("listings");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {/* Tabs — horizontal scroll on small screens */}
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50/60 p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-white text-[#0369a1] shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="p-4 sm:p-6">
          {tab === "listings" && (
            <MyListings listings={listings} onAddNew={() => setTab("add")} />
          )}

          {tab === "leads" && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  My Leads
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Enquiries received for your listings
                </p>
              </div>
              <LeadsTable leads={leads} />
            </div>
          )}

          {tab === "add" && <AddPropertyWizard />}

          {tab === "profile" &&
            (profile ? (
              <ProfileForm profile={profile} listings={listings} leads={leads} />
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {fullName ? `Signed in as ${fullName}.` : "Your account."}
                </p>
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
                  Profile could not be loaded.
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
