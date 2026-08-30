import { useState } from "react";
import { ALERTS } from "../data/mockData";

interface FraudAlertsProps {
  onNavigate: (page: any, data?: any) => void;
}

const STATUS_FLOW = ["Detected", "Under Review", "Investigation", "Resolved", "Escalated"];

function SeverityBadge({ severity }: { severity: string }) {
  const cfg: Record<string, { bg: string; color: string; dot: string }> = {
    Critical: { bg: "#FEE2E2", color: "#DC2626", dot: "#DC2626" },
    High: { bg: "#FFEDD5", color: "#EA580C", dot: "#EA580C" },
    Medium: { bg: "#FEF3C7", color: "#D97706", dot: "#D97706" },
    Low: { bg: "#DCFCE7", color: "#15803D", dot: "#15803D" },
  };
  const c = cfg[severity] || cfg.Low;
  return (
    <span style={{ background: c.bg, color: c.color, padding: "2px 8px", borderRadius: "3px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {severity.toUpperCase()}
    </span>
  );
}

export function FraudAlerts({ onNavigate }: FraudAlertsProps) {
  const [alerts, setAlerts] = useState(ALERTS.map(a => ({ ...a })));
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const updateStatus = (id: string, newStatus: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    setSuccessMsg(`Alert ${id} status updated to "${newStatus}".`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const filtered = alerts.filter(a => {
    if (filterSeverity !== "All" && a.severity !== filterSeverity) return false;
    if (filterStatus !== "All" && a.status !== filterStatus) return false;
    if (search && !a.anomaly.toLowerCase().includes(search.toLowerCase()) && !a.project.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    Critical: alerts.filter(a => a.severity === "Critical").length,
    High: alerts.filter(a => a.severity === "High").length,
    Medium: alerts.filter(a => a.severity === "Medium").length,
    Resolved: alerts.filter(a => a.status === "Resolved").length,
  };

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>Fraud & Anomaly Alert Centre</h1>
        <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>AI-generated alerts requiring review and administrative action</div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        {[
          { label: "Critical", value: counts.Critical, color: "#DC2626", bg: "#FEE2E2", filter: "Critical" },
          { label: "High Severity", value: counts.High, color: "#EA580C", bg: "#FFEDD5", filter: "High" },
          { label: "Medium Severity", value: counts.Medium, color: "#D97706", bg: "#FEF3C7", filter: "Medium" },
          { label: "Resolved", value: counts.Resolved, color: "#15803D", bg: "#DCFCE7", filter: "Resolved" },
        ].map((c, i) => (
          <div key={i} onClick={() => setFilterSeverity(i < 3 ? c.filter : "All")}
            style={{ background: "#fff", border: `1px solid ${c.color}30`, borderTop: `3px solid ${c.color}`, borderRadius: "3px", padding: "14px", cursor: "pointer" }}>
            <div style={{ fontSize: "28px", fontWeight: 700, color: c.color, fontFamily: "monospace" }}>{c.value}</div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#6B7480", textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</div>
          </div>
        ))}
      </div>

      {successMsg && (
        <div style={{ background: "#DCFCE7", border: "1px solid #15803D", borderRadius: "3px", padding: "8px 14px", marginBottom: "12px", fontSize: "12px", color: "#15803D" }}>✓ {successMsg}</div>
      )}

      {/* Filters */}
      <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "12px 14px", marginBottom: "14px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#6B7480", marginBottom: "4px" }}>Search</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search alerts..." style={{ padding: "6px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", width: "200px" }} />
        </div>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#6B7480", marginBottom: "4px" }}>Severity</div>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", background: "#fff", minWidth: "130px" }}>
            {["All", "Critical", "High", "Medium", "Low"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#6B7480", marginBottom: "4px" }}>Status</div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", background: "#fff", minWidth: "180px" }}>
            {["All", "Pending Verification", "Under Review", "Under Investigation", "Resolved", "Escalated"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <button onClick={() => { setFilterSeverity("All"); setFilterStatus("All"); setSearch(""); }}
          style={{ padding: "6px 12px", background: "#F0F1F4", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", cursor: "pointer", alignSelf: "flex-end" }}>Reset</button>
      </div>

      {/* Status workflow reference */}
      <div style={{ background: "#EEF2F9", border: "1px solid #C8D8F0", borderRadius: "3px", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#3A4050", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, color: "#1B3A6B" }}>Alert Workflow:</span>
        {STATUS_FLOW.map((s, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {i > 0 && <span style={{ color: "#9AA3B0" }}>→</span>}
            <span style={{ background: "#fff", border: "1px solid #C8D8F0", padding: "2px 8px", borderRadius: "3px", fontWeight: 500 }}>{s}</span>
          </span>
        ))}
      </div>

      {/* Alert Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.map((alert, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #E2E5EA", borderLeft: `4px solid ${alert.severity === "Critical" ? "#DC2626" : alert.severity === "High" ? "#EA580C" : "#D97706"}`, borderRadius: "3px", padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
                  <SeverityBadge severity={alert.severity} />
                  <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#6B7480" }}>{alert.id}</span>
                  <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#1B3A6B", fontWeight: 600 }}>{alert.project}</span>
                  <span style={{ fontSize: "11px", color: "#9AA3B0" }}>· {alert.date}</span>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A1D23", marginBottom: "4px" }}>{alert.anomaly}</div>
                <div style={{ fontSize: "12px", color: "#6B7480", marginBottom: "6px" }}>{alert.description}</div>
                <div style={{ display: "flex", gap: "16px", fontSize: "12px", flexWrap: "wrap" }}>
                  <span><span style={{ color: "#9AA3B0" }}>Project: </span><span style={{ fontWeight: 500 }}>{alert.projectName}</span></span>
                  <span><span style={{ color: "#9AA3B0" }}>Amount: </span><span style={{ fontWeight: 600, fontFamily: "monospace" }}>{alert.amount}</span></span>
                  <span><span style={{ color: "#9AA3B0" }}>AI Confidence: </span><span style={{ fontWeight: 600, color: alert.confidence > 85 ? "#DC2626" : "#D97706" }}>{alert.confidence}%</span></span>
                  <span><span style={{ color: "#9AA3B0" }}>District: </span><span style={{ fontWeight: 500 }}>{alert.district}</span></span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end", flexShrink: 0 }}>
                <span style={{
                  padding: "3px 10px", borderRadius: "3px", fontSize: "11px", fontWeight: 600,
                  background: alert.status === "Pending Verification" ? "#FEF3C7" : alert.status === "Under Investigation" ? "#FEE2E2" : alert.status === "Resolved" ? "#DCFCE7" : "#EEF2F9",
                  color: alert.status === "Pending Verification" ? "#D97706" : alert.status === "Under Investigation" ? "#DC2626" : alert.status === "Resolved" ? "#15803D" : "#1B3A6B",
                }}>
                  {alert.status}
                </span>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button onClick={() => onNavigate("project-detail", { id: alert.project, name: alert.projectName, riskLevel: alert.severity, risk: alert.confidence, district: alert.district, state: "Rajasthan", approved: 48.5, utilized: 42.1, completion: 78, status: "Under Implementation", mp: "—", constituency: "—", category: "—", agency: "—", vendor: "—", startDate: "—", expectedCompletion: "—", lastUpdated: alert.date })}
                    style={{ padding: "4px 10px", background: "#EEF2F9", color: "#1B3A6B", border: "1px solid #C8D8F0", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>View Details</button>
                  {alert.status === "Pending Verification" && (
                    <button onClick={() => updateStatus(alert.id, "Under Review")}
                      style={{ padding: "4px 10px", background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>Mark Under Review</button>
                  )}
                  {alert.status === "Under Review" && (
                    <button onClick={() => updateStatus(alert.id, "Under Investigation")}
                      style={{ padding: "4px 10px", background: "#FFEDD5", color: "#EA580C", border: "1px solid #FED7AA", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>Mark Under Investigation</button>
                  )}
                  {alert.status === "Under Investigation" && (
                    <button onClick={() => updateStatus(alert.id, "Resolved")}
                      style={{ padding: "4px 10px", background: "#DCFCE7", color: "#15803D", border: "1px solid #BBF7D0", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>Mark Resolved</button>
                  )}
                  {alert.status !== "Resolved" && alert.status !== "Escalated" && (
                    <button onClick={() => updateStatus(alert.id, "Escalated")}
                      style={{ padding: "4px 10px", background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: "3px", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}>Escalate</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "40px", textAlign: "center", color: "#9AA3B0" }}>
            No alerts match the current filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
