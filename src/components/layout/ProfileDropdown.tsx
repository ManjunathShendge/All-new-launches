"use client";

import { Fragment, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import {
  ArrowRightStartOnRectangleIcon,
  BellIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Profile = {
  full_name: string;
  account_type: "agent" | "owner" | "user";
  role: "admin" | "user";
};

export default function ProfileDropdown() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, account_type, role")
      .eq("id", user.id)
      .single();

    console.log("Profile Data:", data);
    console.log("Profile Error:", error);

    if (data) {
      setProfile(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const getDashboardRoute = () => {
    console.log("Current Profile:", profile);

    if (!profile) {
      console.log("Profile is NULL");
      return "/";
    }

    if (profile.role === "admin") {
      return "/admin/dashboard";
    }

    if (profile.account_type === "agent") {
      return "/agent/dashboard";
    }

    if (profile.account_type === "owner") {
      return "/owner/dashboard";
    }

    return "/profile";
  };

  const getDashboardLabel = () => {
    if (!profile) return "Dashboard";
    if (profile.role === "admin") return "Admin Dashboard";
    if (profile.account_type === "user") return "Profile";
    return "Dashboard";
  };

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2">
        {initials}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1 scale-95"
        enterTo="opacity-100 translate-y-0 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0 scale-100"
        leaveTo="opacity-0 translate-y-1 scale-95"
      >
        <Menu.Items className="absolute left-1/2 top-full z-50 mt-3 max-h-[75vh] w-48 -translate-x-1/2 origin-top overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl focus:outline-none">
          {/* Header */}
          <div className="px-3 py-4 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
              {initials}
            </div>
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {profile?.full_name ?? "Loading..."}
            </h3>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">
              {profile?.role === "admin"
                ? "Administrator"
                : profile?.account_type}
            </p>
          </div>

          <div className="h-px bg-slate-100 mb-2 mx-2" />

          {/* Action Items */}
          <div className="space-y-1">
            {/* Dashboard */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => {
                    console.log("Redirecting To:", getDashboardRoute());
                    router.push(getDashboardRoute());
                  }}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-slate-50 text-slate-900" : "text-slate-600"
                  }`}
                >
                  <Squares2X2Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      active
                        ? "text-slate-900"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span className="truncate">{getDashboardLabel()}</span>
                </button>
              )}
            </Menu.Item>

            {/* Notifications */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => router.push(getDashboardRoute())}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-slate-50 text-slate-900" : "text-slate-600"
                  }`}
                >
                  <BellIcon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      active
                        ? "text-slate-900"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span className="truncate">Notifications</span>
                </button>
              )}
            </Menu.Item>
          </div>

          <div className="h-px bg-slate-100 my-2 mx-2" />

          {/* Logout */}
          <div className="pb-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-red-50 text-red-700" : "text-red-600"
                  }`}
                >
                  <ArrowRightStartOnRectangleIcon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      active
                        ? "text-red-700"
                        : "text-red-400 group-hover:text-red-600"
                    }`}
                  />
                  <span className="truncate">Logout</span>
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
