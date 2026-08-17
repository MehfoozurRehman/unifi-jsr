"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  RefreshCw, 
  ArrowRight, 
  Zap,
  TrendingUp
} from "lucide-react";
import { useState } from "react";

interface DashboardViewProps {
  onNavigateToTab: (tab: string) => void;
}

export function DashboardView({ onNavigateToTab }: DashboardViewProps) {
  const stats = useQuery(api.attendance.getStats);
  const recentPunches = useQuery(api.attendance.listPunches, { limit: 8 });
  const settings = useQuery(api.settings.get);

  const syncUnifiAction = useAction(api.unifi.syncUsers);
  const syncJisrAction = useAction(api.jisr.syncEmployees);
  const manualRetryAction = useAction(api.attendance.manualRetry);

  const [syncingUnifi, setSyncingUnifi] = useState(false);
  const [syncingJisr, setSyncingJisr] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncUnifi = async () => {
    setSyncingUnifi(true);
    setSyncMessage(null);
    try {
      const res = await syncUnifiAction();
      setSyncMessage(res.message);
    } catch (e: unknown) {
      setSyncMessage((e as Error).message);
    } finally {
      setSyncingUnifi(false);
    }
  };

  const handleSyncJisr = async () => {
    setSyncingJisr(true);
    setSyncMessage(null);
    try {
      const res = await syncJisrAction();
      setSyncMessage(res.message);
    } catch (e: unknown) {
      setSyncMessage((e as Error).message);
    } finally {
      setSyncingJisr(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
            Attendance Integration Pipeline
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Real-time Active
            </span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Bridging UniFi Access Apple Wallet / NFC badge swipes to Jisr HR Attendance API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncUnifi}
            disabled={syncingUnifi}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-700/80 transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingUnifi ? "animate-spin text-zinc-400" : ""}`} />
            {syncingUnifi ? "Syncing..." : "Sync UniFi"}
          </button>

          <button
            onClick={handleSyncJisr}
            disabled={syncingJisr}
            className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-medium transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingJisr ? "animate-spin" : ""}`} />
            {syncingJisr ? "Syncing..." : "Sync Jisr"}
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs flex items-center justify-between">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage(null)} className="text-zinc-500 hover:text-zinc-300 text-xs">Dismiss</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Ingested Events</span>
            <Zap className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold text-zinc-100 mt-2 font-mono">{stats?.totalEvents ?? 0}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">UniFi swipes captured</div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Delivered to Jisr</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-semibold text-emerald-400 mt-2 font-mono">{stats?.sentPunches ?? 0}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Successful API punches</div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Pending / Retrying</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-semibold text-amber-400 mt-2 font-mono">{stats?.pendingPunches ?? 0}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Queued with backoff retry</div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Unmapped Events</span>
            <Users className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-2xl font-semibold text-zinc-200 mt-2 font-mono">{stats?.unmappedEvents ?? 0}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Awaiting employee mapping</div>
        </div>
      </div>

      {/* Real-time Architecture Pipeline */}
      <div className="bg-zinc-900/30 border border-zinc-800/70 p-5 rounded-xl">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
          System Architecture Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase">1. UniFi Access</div>
            <div className="text-xs font-medium text-zinc-200 mt-1">Apple Wallet / NFC Pass</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Hardware managed by UniFi</div>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
            <div className="text-[11px] font-semibold text-emerald-400 uppercase">2. Convex Receiver</div>
            <div className="text-xs font-medium text-zinc-200 mt-1">Deduplication & Buffer</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Instant 202 ack & fingerprinting</div>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
            <div className="text-[11px] font-semibold text-amber-400 uppercase">3. Mapping Engine</div>
            <div className="text-xs font-medium text-zinc-200 mt-1">{stats?.activeMappings ?? 0} Active Pairs</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Zone: {settings?.timezone || "Asia/Riyadh"}</div>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
            <div className="text-[11px] font-semibold text-zinc-300 uppercase">4. Jisr API</div>
            <div className="text-xs font-medium text-zinc-200 mt-1">Guaranteed Delivery</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Auto-retries on 429/5xx</div>
          </div>
        </div>
      </div>

      {/* Recent Punches Feed */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-zinc-100 text-sm">Live Attendance Punches</h2>
            <p className="text-zinc-500 text-xs">Real-time stream of punches processed and sent to Jisr</p>
          </div>
          <button
            onClick={() => onNavigateToTab("events")}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition cursor-pointer"
          >
            Audit Log <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-500 uppercase text-[11px] font-medium border-b border-zinc-800/80">
              <tr>
                <th className="px-5 py-3">Time (Saudi Arabia)</th>
                <th className="px-5 py-3">UniFi User ID</th>
                <th className="px-5 py-3">Jisr Employee ID</th>
                <th className="px-5 py-3">Direction</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {recentPunches?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-zinc-500">
                    No attendance events received yet. Send a test swipe from the{" "}
                    <button onClick={() => onNavigateToTab("simulator")} className="text-zinc-300 hover:underline font-medium">
                      Webhook Simulator
                    </button>
                    .
                  </td>
                </tr>
              ) : (
                recentPunches?.map((punch) => (
                  <tr key={punch._id} className="hover:bg-zinc-800/30 transition">
                    <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-300">
                      {new Date(punch.occurredAt).toLocaleString("en-US", { timeZone: settings?.timezone || "Asia/Riyadh" })}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-400">{punch.unifiUserId}</td>
                    <td className="px-5 py-3.5 font-semibold text-zinc-200">{punch.jisrEmployeeId}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                        {punch.punchType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {punch.status === "SENT" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> SENT
                        </span>
                      )}
                      {punch.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" /> PENDING
                        </span>
                      )}
                      {(punch.status === "FAILED" || punch.status === "PERMANENT_FAILURE") && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20" title={punch.error}>
                          <AlertTriangle className="w-3 h-3" /> {punch.status}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {punch.status !== "SENT" && (
                        <button
                          onClick={() => manualRetryAction({ punchId: punch._id })}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 rounded border border-zinc-700/70 transition cursor-pointer"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
