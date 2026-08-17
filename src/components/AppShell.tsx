"use client";

import { useState } from "react";
import { 
  Activity, 
  Users, 
  ListFilter, 
  Zap, 
  Radio
} from "lucide-react";
import { DashboardView } from "./views/DashboardView";
import { MappingsView } from "./views/MappingsView";
import { EventsView } from "./views/EventsView";
import { SimulatorView } from "./views/SimulatorView";

export type TabId = "dashboard" | "mappings" | "events" | "simulator";

const TABS = [
  { id: "dashboard" as TabId, label: "Dashboard", icon: Activity },
  { id: "mappings" as TabId, label: "Mapping Studio", icon: Users },
  { id: "events" as TabId, label: "Audit Feed", icon: ListFilter },
  { id: "simulator" as TabId, label: "Simulator", icon: Zap },
];

export function AppShell({ initialTab = "dashboard" }: { initialTab?: TabId }) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Sleek Minimalist Header with Flush Underline Tabs */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Status */}
          <div className="flex items-center gap-3 py-3">
            <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-sm">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-100 tracking-tight text-sm">UniFi ↔ Jisr Bridge</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                ACTIVE
              </span>
            </div>
          </div>

          {/* Clean Flush Underline Tab Bar (Vercel / GitHub Style) */}
          <nav className="flex items-center gap-1 -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={`flex items-center gap-2 px-3.5 py-3.5 text-xs font-medium border-b-2 transition-colors cursor-pointer select-none ${
                    isActive
                      ? "border-zinc-100 text-zinc-100 font-semibold"
                      : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-zinc-100" : "text-zinc-500"}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {activeTab === "dashboard" && <DashboardView onNavigateToTab={(t) => setActiveTab(t as TabId)} />}
        {activeTab === "mappings" && <MappingsView />}
        {activeTab === "events" && <EventsView />}
        {activeTab === "simulator" && <SimulatorView />}
      </main>
    </div>
  );
}
