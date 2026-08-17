"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { 
  ListFilter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight, 
  Code
} from "lucide-react";

export function EventsView() {
  const [activeTab, setActiveTab] = useState<"PUNCHES" | "RAW_EVENTS">("PUNCHES");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const settings = useQuery(api.settings.get);

  const punches = useQuery(api.attendance.listPunches, {
    status: statusFilter,
    limit: 100,
  });

  const events = useQuery(api.attendance.listEvents, {
    status: statusFilter,
    limit: 100,
  });

  const manualRetryAction = useAction(api.attendance.manualRetry);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-xl">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-zinc-400" />
            Audit & Punch Stream
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Complete audit trail of UniFi Access badge taps, normalization, and Jisr API transmissions.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("PUNCHES")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
              activeTab === "PUNCHES"
                ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Jisr Attendance Punches
          </button>
          <button
            onClick={() => setActiveTab("RAW_EVENTS")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
              activeTab === "RAW_EVENTS"
                ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Raw UniFi Webhooks
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {["ALL", "SENT", "PENDING", "UNMAPPED", "FAILED", "PERMANENT_FAILURE"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-md text-xs font-medium border transition cursor-pointer ${
              statusFilter === status
                ? "bg-zinc-800 text-zinc-100 border-zinc-600 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                : "bg-zinc-900/40 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800/50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        {activeTab === "PUNCHES" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-500 text-[11px] uppercase font-medium border-b border-zinc-800/80">
                <tr>
                  <th className="w-8 px-3 py-3"></th>
                  <th className="px-5 py-3">Time (Saudi Arabia)</th>
                  <th className="px-5 py-3">UniFi User</th>
                  <th className="px-5 py-3">Jisr Employee</th>
                  <th className="px-5 py-3">Direction</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {punches?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">
                      No punches matching current filter.
                    </td>
                  </tr>
                ) : (
                  punches?.map((punch) => (
                    <>
                      <tr
                        key={punch._id}
                        onClick={() => toggleExpand(punch._id)}
                        className="hover:bg-zinc-800/30 transition cursor-pointer"
                      >
                        <td className="px-3 py-3.5 text-zinc-500">
                          {expandedId === punch._id ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </td>
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
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <AlertTriangle className="w-3 h-3" /> {punch.status}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
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

                      {/* Expandable JSON details drawer */}
                      {expandedId === punch._id && (
                        <tr className="bg-zinc-950 border-b border-zinc-800">
                          <td colSpan={7} className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-[11px] font-semibold uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
                                  <Code className="w-3 h-3 text-zinc-400" /> Jisr Request Payload
                                </div>
                                <pre className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-48">
                                  {JSON.stringify(punch.jisrRequest || "Pending dispatch", null, 2)}
                                </pre>
                              </div>

                              <div>
                                <div className="text-[11px] font-semibold uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
                                  <Code className="w-3 h-3 text-emerald-400" /> Jisr Response / Error
                                </div>
                                <pre className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-48">
                                  {punch.error
                                    ? `ERROR: ${punch.error}`
                                    : JSON.stringify(punch.jisrResponse || "No response received", null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Raw Events Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-500 text-[11px] uppercase font-medium border-b border-zinc-800/80">
                <tr>
                  <th className="w-8 px-3 py-3"></th>
                  <th className="px-5 py-3">Occurred</th>
                  <th className="px-5 py-3">Event Type</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Door / Device</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {events?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-zinc-500">
                      No raw events found.
                    </td>
                  </tr>
                ) : (
                  events?.map((ev) => (
                    <>
                      <tr
                        key={ev._id}
                        onClick={() => toggleExpand(ev._id)}
                        className="hover:bg-zinc-800/30 transition cursor-pointer"
                      >
                        <td className="px-3 py-3.5 text-zinc-500">
                          {expandedId === ev._id ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-300">
                          {new Date(ev.occurredAt).toLocaleString("en-US", { timeZone: settings?.timezone || "Asia/Riyadh" })}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-400">{ev.eventType}</td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-zinc-200">{ev.userName || "Unknown"}</span>
                          <span className="text-[11px] font-mono text-zinc-500 ml-1">({ev.userId || "N/A"})</span>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-400">
                          {ev.doorName || ev.doorId || "General Access"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                            {ev.status}
                          </span>
                        </td>
                      </tr>

                      {expandedId === ev._id && (
                        <tr className="bg-zinc-950 border-b border-zinc-800">
                          <td colSpan={6} className="p-5">
                            <div className="text-[11px] font-semibold uppercase text-zinc-400 mb-2">
                              Raw Ingested Webhook Payload
                            </div>
                            <pre className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-60">
                              {JSON.stringify(ev.payload, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
