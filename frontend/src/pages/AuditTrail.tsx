import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

export function AuditTrail() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("All Modules");
  const [filterRole, setFilterRole] = useState("All Roles");
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAuditTrail({
        search: search.trim() || undefined,
        module: filterModule === "All Modules" ? undefined : filterModule,
        role: filterRole === "All Roles" ? undefined : filterRole,
      });
      setLogs(res || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [search, filterModule, filterRole]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadLogs]);

  const modules = ["All Modules", "Projects", "AI Risk Intelligence", "Alerts & Investigations", "Financial Monitoring", "Geo Monitoring", "Administration"];
  const roles = ["All Roles", "Administrator", "Monitoring Officer", "Finance Officer", "Auditor", "System"];

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>Audit Trail</h1>
        <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>Immutable record of all system actions and user activities | Compliant with IT Act, 2000</div>
      </div>

      <div style={{ background: "#EEF2F9", border: "1px solid #C8D8F0", borderRadius: "3px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "#1B3A6B", display: "flex", alignItems: "center", gap: "8px" }}>
        <span>🔒</span>
        <span>All audit records are cryptographically verified and tamper-proof. Deletion is not permitted. Audit log is retained per MoSPI statutory policy.</span>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "12px 14px", marginBottom: "14px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#6B7480", marginBottom: "4px" }}>Search</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actions, users, projects..." style={{ padding: "6px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", width: "220px" }} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#6B7480", marginBottom: "4px" }}>Module</div>
            <select value={filterModule} onChange={e => setFilterModule(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", background: "#fff", minWidth: "160px" }}>
              {modules.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#6B7480", marginBottom: "4px" }}>Role</div>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", background: "#fff", minWidth: "160px" }}>
              {roles.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={() => { setSearch(""); setFilterModule("All Modules"); setFilterRole("All Roles"); }} style={{ padding: "6px 12px", background: "#F0F1F4", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", cursor: "pointer", alignSelf: "flex-end" }}>Reset</button>
        </div>
        <button onClick={() => window.open("/api/reports/export?dataset_type=alerts&format=csv", "_blank")} style={{ padding: "6px 14px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", cursor: "pointer", alignSelf: "flex-end" }}>Export Audit Log</button>
      </div>

      {/* Audit Table */}
      <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #E2E5EA", fontSize: "12px", color: "#6B7480" }}>
          Showing {logs.length} immutable records
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#F0F1F4" }}>
              {["Timestamp", "User / Role", "Action", "Module", "Project / Record", "Old Value", "New Value", "Session"].map(h => (
                <th key={h} style={{ padding: "9px 11px", textAlign: "left", fontWeight: 700, fontSize: "11px", color: "#3A4050", textTransform: "uppercase", borderBottom: "2px solid #D0D5DD", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F0F1F4" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F7F8FA"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
                <td style={{ padding: "9px 11px", fontFamily: "monospace", fontSize: "11px", color: "#6B7480", whiteSpace: "nowrap" }}>{log.timestamp}</td>
                <td style={{ padding: "9px 11px" }}>
                  <div style={{ fontWeight: 500, fontSize: "12px" }}>{log.user}</div>
                  <div style={{ fontSize: "10px", color: log.role === "System" ? "#9AA3B0" : "#6B7480", fontStyle: log.role === "System" ? "italic" : "normal" }}>{log.role}</div>
                </td>
                <td style={{ padding: "9px 11px", fontWeight: 500, color: "#1A1D23" }}>{log.action}</td>
                <td style={{ padding: "9px 11px" }}>
                  <span style={{ background: "#EEF2F9", color: "#1B3A6B", padding: "2px 7px", borderRadius: "3px", fontSize: "10px", fontWeight: 600 }}>{log.module}</span>
                </td>
                <td style={{ padding: "9px 11px", fontFamily: "monospace", fontSize: "11px", color: "#1B3A6B" }}>{log.project}</td>
                <td style={{ padding: "9px 11px", fontSize: "11px", color: "#9AA3B0" }}>{log.oldValue}</td>
                <td style={{ padding: "9px 11px", fontSize: "11px", fontWeight: 500, color: "#1B3A6B" }}>{log.newValue}</td>
                <td style={{ padding: "9px 11px", fontFamily: "monospace", fontSize: "10px", color: "#9AA3B0" }}>{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#9AA3B0", fontSize: "13px" }}>
            {loading ? "Loading audit records..." : "No audit records match the current filters."}
          </div>
        )}
      </div>
    </div>
  );
}

