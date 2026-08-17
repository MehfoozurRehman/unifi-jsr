"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { 
  Users, 
  Sparkles, 
  Check, 
  Trash2, 
  RefreshCw, 
  ArrowRightLeft, 
  Search
} from "lucide-react";

export function MappingsView() {
  const mappings = useQuery(api.mappings.list);
  const data = useQuery(api.mappings.getUnmappedAndSuggestions);

  const saveMappingMutation = useMutation(api.mappings.saveMapping);
  const removeMappingMutation = useMutation(api.mappings.remove);
  const toggleActiveMutation = useMutation(api.mappings.toggleActive);

  const syncUnifiAction = useAction(api.unifi.syncUsers);
  const syncJisrAction = useAction(api.jisr.syncEmployees);

  const [selectedUnifiId, setSelectedUnifiId] = useState("");
  const [selectedJisrId, setSelectedJisrId] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleManualPair = async () => {
    if (!selectedUnifiId || !selectedJisrId || !data) return;

    const unifiUser = data.unmappedUnifi.find((u) => u.unifiId === selectedUnifiId);
    const jisrEmp = data.unmappedJisr.find((j) => j.jisrId === selectedJisrId);

    if (!unifiUser || !jisrEmp) return;

    try {
      await saveMappingMutation({
        unifiUserId: unifiUser.unifiId,
        unifiUserName: unifiUser.name,
        jisrEmployeeId: jisrEmp.jisrId,
        jisrEmployeeName: jisrEmp.name,
        active: true,
      });

      setSelectedUnifiId("");
      setSelectedJisrId("");
      setFeedback(`Mapped ${unifiUser.name} ↔ ${jisrEmp.name}. Historical unmapped events are being backfilled.`);
    } catch (e: unknown) {
      setFeedback(`Error: ${(e as Error).message}`);
    }
  };

  const handleAcceptSuggestion = async (s: {
    unifiUserId: string;
    unifiUserName: string;
    jisrEmployeeId: string;
    jisrEmployeeName: string;
  }) => {
    try {
      await saveMappingMutation({
        unifiUserId: s.unifiUserId,
        unifiUserName: s.unifiUserName,
        jisrEmployeeId: s.jisrEmployeeId,
        jisrEmployeeName: s.jisrEmployeeName,
        active: true,
      });
      setFeedback(`Accepted match: ${s.unifiUserName} ↔ ${s.jisrEmployeeName}`);
    } catch (e: unknown) {
      setFeedback(`Error: ${(e as Error).message}`);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      const [uRes, jRes] = await Promise.all([syncUnifiAction(), syncJisrAction()]);
      setFeedback(`Sync completed: ${uRes.message} | ${jRes.message}`);
    } catch (e: unknown) {
      setFeedback(`Sync failed: ${(e as Error).message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredMappings = mappings?.filter(
    (m) =>
      m.unifiUserName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.jisrEmployeeName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.unifiUserId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.jisrEmployeeId.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-xl">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-400" />
            Employee Mapping Studio
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Pair UniFi Access user credentials with Jisr HR employee accounts for accurate clock-in dispatch.
          </p>
        </div>

        <button
          onClick={handleSyncAll}
          disabled={isSyncing}
          className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-medium transition shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync Users from APIs"}
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Smart Match Suggestions */}
      {data && data.suggestions.length > 0 && (
        <div className="bg-zinc-900/40 border border-zinc-700/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Auto-Match Suggestions ({data.suggestions.length})
          </div>
          <p className="text-zinc-400 text-xs mb-3.5">
            Identified matching users across UniFi and Jisr based on identical work emails or employee badge numbers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.suggestions.map((s, idx) => (
              <div key={idx} className="bg-zinc-950 border border-zinc-800/80 p-3.5 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>UniFi: <strong className="text-zinc-100">{s.unifiUserName}</strong></span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono border border-zinc-700/60">
                      {s.matchReason}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1.5">
                    Jisr: <strong className="text-emerald-400">{s.jisrEmployeeName}</strong>
                  </div>
                  {s.unifiUserEmail && (
                    <div className="text-[11px] text-zinc-500 mt-1 font-mono">{s.unifiUserEmail}</div>
                  )}
                </div>

                <button
                  onClick={() => handleAcceptSuggestion(s)}
                  className="mt-3.5 w-full flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium py-1.5 rounded-md transition border border-zinc-700/70 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Accept Match
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Mapping Form */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-100 mb-1 flex items-center gap-1.5">
          <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-400" />
          Manual User Pairing
        </h2>
        <p className="text-zinc-400 text-xs mb-3.5">
          Select an unmapped UniFi user and pair them with a Jisr employee profile.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Unmapped UniFi User</label>
            <select
              value={selectedUnifiId}
              onChange={(e) => setSelectedUnifiId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="">-- Choose UniFi User --</option>
              {data?.unmappedUnifi.map((u) => (
                <option key={u.unifiId} value={u.unifiId}>
                  {u.name} {u.email ? `(${u.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Unmapped Jisr Employee</label>
            <select
              value={selectedJisrId}
              onChange={(e) => setSelectedJisrId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="">-- Choose Jisr Employee --</option>
              {data?.unmappedJisr.map((j) => (
                <option key={j.jisrId} value={j.jisrId}>
                  {j.name} {j.code ? `[#${j.code}]` : ""} {j.email ? `(${j.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleManualPair}
            disabled={!selectedUnifiId || !selectedJisrId}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-medium py-2 rounded-lg text-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Create Mapping
          </button>
        </div>
      </div>

      {/* Active Mappings Table */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-zinc-100 text-sm">Active Mappings ({mappings?.length ?? 0})</h2>
            <p className="text-zinc-500 text-xs">Configured pairings actively receiving attendance sync</p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search mappings..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 w-full sm:w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-500 text-[11px] uppercase font-medium border-b border-zinc-800/80">
              <tr>
                <th className="px-5 py-3">UniFi User</th>
                <th className="px-5 py-3">Jisr Employee</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredMappings?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-zinc-500">
                    No active mappings found. Use auto-suggestions or manual pairing above.
                  </td>
                </tr>
              ) : (
                filteredMappings?.map((m) => (
                  <tr key={m._id} className="hover:bg-zinc-800/30 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-zinc-200">{m.unifiUserName}</div>
                      <div className="text-[11px] font-mono text-zinc-500">{m.unifiUserId}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-emerald-400">{m.jisrEmployeeName}</div>
                      <div className="text-[11px] font-mono text-zinc-500">ID: {m.jisrEmployeeId}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleActiveMutation({ id: m._id, active: !m.active })}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition cursor-pointer ${
                          m.active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700"
                        }`}
                      >
                        {m.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 text-[11px]">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => removeMappingMutation({ id: m._id })}
                        className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer"
                        title="Remove Mapping"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
