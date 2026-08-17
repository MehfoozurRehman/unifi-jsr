"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { Zap, Send, CheckCircle2, Play, AlertCircle, Radio } from "lucide-react";

export function SimulatorView() {
  const mappings = useQuery(api.mappings.list);
  const ingestMutation = useMutation(api.attendance.ingestWebhookEvent);

  const [selectedUser, setSelectedUser] = useState("");
  const [eventType, setEventType] = useState("access.door.unlock");
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");
  const [doorName, setDoorName] = useState("Main Entrance Door");
  const [customJson, setCustomJson] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleSendStandard = async () => {
    setIsSending(true);
    setResult(null);

    const mappedUser = mappings?.find((m) => m.unifiUserId === selectedUser);
    const userId = selectedUser || "unifi-user-sample-01";
    const userName = mappedUser?.unifiUserName || "Sample Employee";

    const payload = {
      event: eventType,
      id: `evt-${Date.now()}`,
      timestamp: Date.now(),
      actor: {
        id: userId,
        name: userName,
        type: "user",
      },
      door: {
        id: "door-main-01",
        name: doorName,
        direction: direction,
      },
      device: {
        id: "ua-reader-pro-01",
        name: "UA Reader Pro",
      },
      direction: direction,
    };

    try {
      const res = await ingestMutation({ rawPayload: payload });
      setResult(res);
    } catch (e: unknown) {
      setResult({ accepted: false, error: (e as Error).message });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendCustom = async () => {
    setIsSending(true);
    setResult(null);
    try {
      const parsed = JSON.parse(customJson);
      const res = await ingestMutation({ rawPayload: parsed });
      setResult(res);
    } catch (e: unknown) {
      setResult({ accepted: false, error: `Invalid JSON or execution error: ${(e as Error).message}` });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-xl">
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          UniFi Webhook Event Simulator
        </h1>
        <p className="text-zinc-400 text-xs mt-1">
          Trigger simulated Apple Wallet / NFC badge swipes to verify normalization, employee resolution, deduplication, and Jisr delivery in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Visual Generator */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-3.5 shadow-sm">
          <h2 className="font-semibold text-zinc-100 text-sm border-b border-zinc-800/80 pb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-zinc-400" /> Standard Event Tap Simulator
          </h2>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Select Mapped Employee</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="">-- Choose mapped user (or sample) --</option>
              {mappings?.map((m) => (
                <option key={m._id} value={m.unifiUserId}>
                  {m.unifiUserName} → Jisr: {m.jisrEmployeeName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as "IN" | "OUT")}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
              >
                <option value="IN">IN (Entry Swipe)</option>
                <option value="OUT">OUT (Exit Swipe)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Door / Reader</label>
              <input
                type="text"
                value={doorName}
                onChange={(e) => setDoorName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <button
            onClick={handleSendStandard}
            disabled={isSending}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-medium py-2 rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {isSending ? "Dispatching Event..." : "Simulate Apple Wallet / NFC Tap"}
          </button>
        </div>

        {/* Custom JSON Injection */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-3.5 shadow-sm">
          <h2 className="font-semibold text-zinc-100 text-sm border-b border-zinc-800/80 pb-3 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" /> Custom JSON Webhook Tester
          </h2>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Raw JSON Body</label>
            <textarea
              rows={5}
              placeholder={`{\n  "event": "access.door.unlock",\n  "actor": { "id": "123", "name": "Ahmed" },\n  "timestamp": ${Date.now()}\n}`}
              value={customJson}
              onChange={(e) => setCustomJson(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg p-2.5 text-[11px] font-mono focus:outline-none focus:border-zinc-500"
            />
          </div>

          <button
            onClick={handleSendCustom}
            disabled={isSending || !customJson.trim()}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-2 rounded-lg text-xs transition border border-zinc-700/70 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Send Custom Payload
          </button>
        </div>
      </div>

      {/* Response Box */}
      {result && (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold mb-2">
            {result.accepted ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Event Accepted & Queued (HTTP 202)
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Ingest Failed
              </span>
            )}
          </div>
          <pre className="bg-zinc-950 p-3 rounded-lg text-[11px] font-mono text-zinc-300 overflow-x-auto border border-zinc-800">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
