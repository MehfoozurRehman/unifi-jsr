"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  Save, 
  CheckCircle2, 
  Radio, 
  Globe, 
  Layers
} from "lucide-react";

export function SettingsView() {
  const currentSettings = useQuery(api.settings.get);
  const updateSettingsMutation = useMutation(api.settings.update);
  const testUnifiAction = useAction(api.unifi.testConnection);
  const testJisrAction = useAction(api.jisr.testConnection);

  const [form, setForm] = useState({
    unifiBaseUrl: "",
    unifiApiToken: "",
    unifiWebhookSecret: "",
    jisrBaseUrl: "https://apis.jisr.net/api",
    jisrApiKey: "",
    jisrApiSecret: "",
    jisrAccessToken: "",
    jisrCompanyId: "",
    timezone: "Asia/Riyadh",
    attendanceMode: "RAW" as "RAW" | "DOOR_RULES" | "DIRECTION",
    entryDoorIds: "",
    exitDoorIds: "",
    allowedEventTypes: "access.door.unlock, door_unlock, access_granted",
    autoSyncIntervalMinutes: 10,
  });

  const [saving, setSaving] = useState(false);
  const [testingUnifi, setTestingUnifi] = useState(false);
  const [testingJisr, setTestingJisr] = useState(false);
  const [unifiResult, setUnifiResult] = useState<{ success: boolean; message: string } | null>(null);
  const [jisrResult, setJisrResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setForm({
        unifiBaseUrl: currentSettings.unifiBaseUrl || "",
        unifiApiToken: currentSettings.unifiApiToken || "",
        unifiWebhookSecret: currentSettings.unifiWebhookSecret || "",
        jisrBaseUrl: currentSettings.jisrBaseUrl || "https://apis.jisr.net/api",
        jisrApiKey: currentSettings.jisrApiKey || "",
        jisrApiSecret: currentSettings.jisrApiSecret || "",
        jisrAccessToken: currentSettings.jisrAccessToken || "",
        jisrCompanyId: currentSettings.jisrCompanyId || "",
        timezone: currentSettings.timezone || "Asia/Riyadh",
        attendanceMode: currentSettings.attendanceMode || "RAW",
        entryDoorIds: currentSettings.entryDoorIds?.join(", ") || "",
        exitDoorIds: currentSettings.exitDoorIds?.join(", ") || "",
        allowedEventTypes: currentSettings.allowedEventTypes?.join(", ") || "access.door.unlock, door_unlock, access_granted",
        autoSyncIntervalMinutes: currentSettings.autoSyncIntervalMinutes || 10,
      });
    }
  }, [currentSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await updateSettingsMutation({
        unifiBaseUrl: form.unifiBaseUrl,
        unifiApiToken: form.unifiApiToken,
        unifiWebhookSecret: form.unifiWebhookSecret || undefined,
        jisrBaseUrl: form.jisrBaseUrl,
        jisrApiKey: form.jisrApiKey || undefined,
        jisrApiSecret: form.jisrApiSecret || undefined,
        jisrAccessToken: form.jisrAccessToken || undefined,
        jisrCompanyId: form.jisrCompanyId || undefined,
        timezone: form.timezone,
        attendanceMode: form.attendanceMode,
        entryDoorIds: form.entryDoorIds.split(",").map((s) => s.trim()).filter(Boolean),
        exitDoorIds: form.exitDoorIds.split(",").map((s) => s.trim()).filter(Boolean),
        allowedEventTypes: form.allowedEventTypes.split(",").map((s) => s.trim()).filter(Boolean),
        autoSyncIntervalMinutes: Number(form.autoSyncIntervalMinutes) || 10,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleTestUnifi = async () => {
    setTestingUnifi(true);
    setUnifiResult(null);
    try {
      const res = await testUnifiAction({
        baseUrl: form.unifiBaseUrl,
        apiToken: form.unifiApiToken,
      });
      setUnifiResult(res);
    } catch (e: unknown) {
      setUnifiResult({ success: false, message: (e as Error).message });
    } finally {
      setTestingUnifi(false);
    }
  };

  const handleTestJisr = async () => {
    setTestingJisr(true);
    setJisrResult(null);
    try {
      const res = await testJisrAction({
        baseUrl: form.jisrBaseUrl,
        apiKey: form.jisrApiKey || undefined,
        apiSecret: form.jisrApiSecret || undefined,
        accessToken: form.jisrAccessToken || undefined,
      });
      setJisrResult(res);
    } catch (e: unknown) {
      setJisrResult({ success: false, message: (e as Error).message });
    } finally {
      setTestingJisr(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-xl">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-zinc-400" />
            Connection Settings
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Configure UniFi Access controller parameters, Jisr Open API keys, door rules, and Saudi Arabia timezone.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
        </div>
      )}

      {/* Grid of Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* UniFi Section */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h2 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-zinc-400" /> UniFi Access Console
            </h2>
            <button
              type="button"
              onClick={handleTestUnifi}
              disabled={testingUnifi || !form.unifiBaseUrl || !form.unifiApiToken}
              className="text-xs font-medium px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/70 disabled:opacity-40 cursor-pointer"
            >
              {testingUnifi ? "Testing..." : "Test Connection"}
            </button>
          </div>

          {unifiResult && (
            <div
              className={`p-3 rounded-lg text-xs border ${
                unifiResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}
            >
              {unifiResult.message}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">UniFi Console Base URL</label>
            <input
              type="text"
              placeholder="https://192.168.1.1:12445"
              value={form.unifiBaseUrl}
              onChange={(e) => setForm({ ...form, unifiBaseUrl: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">UniFi Access API Token</label>
            <input
              type="password"
              placeholder="Paste UniFi API Token"
              value={form.unifiApiToken}
              onChange={(e) => setForm({ ...form, unifiApiToken: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Webhook Secret (Optional)</label>
            <input
              type="password"
              placeholder="Shared secret token for webhook verification"
              value={form.unifiWebhookSecret}
              onChange={(e) => setForm({ ...form, unifiWebhookSecret: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>
        </div>

        {/* Jisr Section */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h2 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" /> Jisr HR Open API
            </h2>
            <button
              type="button"
              onClick={handleTestJisr}
              disabled={testingJisr || !form.jisrBaseUrl}
              className="text-xs font-medium px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/70 disabled:opacity-40 cursor-pointer"
            >
              {testingJisr ? "Testing..." : "Test Connection"}
            </button>
          </div>

          {jisrResult && (
            <div
              className={`p-3 rounded-lg text-xs border ${
                jisrResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}
            >
              {jisrResult.message}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Jisr API Base URL</label>
            <select
              value={form.jisrBaseUrl}
              onChange={(e) => setForm({ ...form, jisrBaseUrl: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="https://apis.jisr.net/api">AWS Hosting: https://apis.jisr.net/api</option>
              <option value="https://api.jisr.net.sa/api/">Saudi Local Server: https://api.jisr.net.sa/api/</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">API Key</label>
              <input
                type="password"
                placeholder="Jisr API Key"
                value={form.jisrApiKey}
                onChange={(e) => setForm({ ...form, jisrApiKey: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">API Secret</label>
              <input
                type="password"
                placeholder="Jisr API Secret"
                value={form.jisrApiSecret}
                onChange={(e) => setForm({ ...form, jisrApiSecret: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Static Access Token (Optional)</label>
            <input
              type="password"
              placeholder="Direct Access-Token if generated in Jisr portal"
              value={form.jisrAccessToken}
              onChange={(e) => setForm({ ...form, jisrAccessToken: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Operational Rules */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-3.5">
        <h2 className="font-semibold text-zinc-100 text-sm flex items-center gap-2 border-b border-zinc-800/80 pb-3">
          <Layers className="w-4 h-4 text-zinc-400" /> Attendance Rules & Timezone
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Target Timezone</label>
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="Asia/Riyadh">Saudi Arabia (Asia/Riyadh, UTC+3)</option>
              <option value="Asia/Dubai">UAE (Asia/Dubai, UTC+4)</option>
              <option value="Africa/Cairo">Egypt (Africa/Cairo, UTC+2)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Attendance Mode</label>
            <select
              value={form.attendanceMode}
              onChange={(e) => setForm({ ...form, attendanceMode: e.target.value as "RAW" | "DOOR_RULES" | "DIRECTION" })}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="RAW">RAW (Forward raw punches, let Jisr calculate in/out)</option>
              <option value="DIRECTION">DIRECTION (Use reader Direction in/out setting)</option>
              <option value="DOOR_RULES">DOOR_RULES (Map specific door IDs to Entry / Exit)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Reconciliation Polling (Minutes)</label>
            <input
              type="number"
              value={form.autoSyncIntervalMinutes}
              onChange={(e) => setForm({ ...form, autoSyncIntervalMinutes: Number(e.target.value) })}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        {form.attendanceMode === "DOOR_RULES" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Entry Door IDs (Comma-separated)</label>
              <input
                type="text"
                placeholder="door-front-1, door-gate-main"
                value={form.entryDoorIds}
                onChange={(e) => setForm({ ...form, entryDoorIds: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Exit Door IDs (Comma-separated)</label>
              <input
                type="text"
                placeholder="door-back-1, door-exit-east"
                value={form.exitDoorIds}
                onChange={(e) => setForm({ ...form, exitDoorIds: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
