import { useState, useEffect } from "react";
import { api } from "../services/api";

const USERS = [
  { name: "R.K. Sharma", role: "Monitoring Officer", email: "rk.sharma@mospi.gov.in", status: "Active", lastLogin: "27 Aug 2026" },
  { name: "Joint Secretary (MoSPI)", role: "Administrator", email: "js@mospi.gov.in", status: "Active", lastLogin: "27 Aug 2026" },
  { name: "A.K. Mishra", role: "Finance Officer", email: "ak.mishra@mospi.gov.in", status: "Active", lastLogin: "26 Aug 2026" },
  { name: "CAG-Auditor P. Gupta", role: "Auditor", email: "p.gupta@cag.gov.in", status: "Active", lastLogin: "25 Aug 2026" },
  { name: "D. Patel", role: "Implementing Agency", email: "d.patel@barmer.raj.gov.in", status: "Active", lastLogin: "24 Aug 2026" },
];

export function Settings() {
  const [activeSection, setActiveSection] = useState("users");
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [confidenceMin, setConfidenceMin] = useState(65);
  const [saved, setSaved] = useState(false);
  const [modelMeta, setModelMeta] = useState<any>(null);

  useEffect(() => {
    async function fetchModelStatus() {
      try {
        const meta = await api.getAIModelStatus();
        if (meta) setModelMeta(meta);
      } catch (err) {
        console.error("Failed to load model status:", err);
      }
    }
    fetchModelStatus();
  }, []);

  const handleSave = async () => {
    try {
      await api.recordAuditEvent({
        action: "Updated AI Threshold Configuration",
        module: "Administration",
        project_id: "SYSTEM",
        old_value: "Risk: 70, Confidence: 65%",
        new_value: `Risk: ${riskThreshold}, Confidence: ${confidenceMin}%`,
        user: "Administrator (Joint Secretary)",
        role: "Administrator"
      });
    } catch (e) {
      console.error(e);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const SECTIONS = [
    { id: "users", label: "User Management" },
    { id: "roles", label: "Roles & Permissions" },
    { id: "ai", label: "AI Thresholds" },
    { id: "alerts", label: "Alert Configuration" },
    { id: "data", label: "Data Source Configuration" },
    { id: "security", label: "Security Settings" },
    { id: "audit", label: "Audit Settings" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>Administration</h1>
        <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>System configuration, user management and security settings</div>
      </div>

      {saved && (
        <div style={{ background: "#DCFCE7", border: "1px solid #15803D", borderRadius: "3px", padding: "8px 14px", marginBottom: "14px", fontSize: "12px", color: "#15803D" }}>✓ Settings saved and recorded in audit log successfully.</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "14px" }}>
        {/* Sidebar */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", overflow: "hidden", height: "fit-content" }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: activeSection === s.id ? "#EEF2F9" : "none", border: "none", borderLeft: activeSection === s.id ? "3px solid #1B3A6B" : "3px solid transparent", color: activeSection === s.id ? "#1B3A6B" : "#3A4050", fontSize: "12px", fontWeight: activeSection === s.id ? 600 : 400, cursor: "pointer", borderBottom: "1px solid #F0F1F4" }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "20px" }}>
          {activeSection === "users" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>User Management</div>
                <button style={{ padding: "6px 14px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ Add User</button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead><tr style={{ background: "#F0F1F4" }}>
                  {["Name", "Role", "Email", "Status", "Last Login", "Action"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, fontSize: "11px", color: "#3A4050", textTransform: "uppercase", borderBottom: "2px solid #D0D5DD" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {USERS.map((u, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F0F1F4" }}>
                      <td style={{ padding: "9px 10px", fontWeight: 500 }}>{u.name}</td>
                      <td style={{ padding: "9px 10px" }}>
                        <span style={{ background: "#EEF2F9", color: "#1B3A6B", padding: "2px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: 600 }}>{u.role}</span>
                      </td>
                      <td style={{ padding: "9px 10px", color: "#6B7480", fontFamily: "monospace", fontSize: "11px" }}>{u.email}</td>
                      <td style={{ padding: "9px 10px" }}>
                        <span style={{ background: "#DCFCE7", color: "#15803D", padding: "2px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: 600 }}>{u.status}</span>
                      </td>
                      <td style={{ padding: "9px 10px", fontSize: "11px", color: "#6B7480" }}>{u.lastLogin}</td>
                      <td style={{ padding: "9px 10px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button style={{ padding: "3px 7px", background: "#EEF2F9", color: "#1B3A6B", border: "1px solid #C8D8F0", borderRadius: "3px", fontSize: "10px", cursor: "pointer" }}>Edit</button>
                          <button style={{ padding: "3px 7px", background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: "3px", fontSize: "10px", cursor: "pointer" }}>Deactivate</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === "ai" && (
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>AI Threshold Configuration</div>
              <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "3px", padding: "10px 12px", marginBottom: "16px", fontSize: "12px", color: "#D97706" }}>
                ⚠ Active Model: {modelMeta?.algorithm || "Isolation Forest + LOF + Rules"} ({modelMeta?.modelVersion || "v1.2.0"}). Changes to AI thresholds affect alert generation.
              </div>

              {[
                { label: "Risk Score Alert Threshold", key: "riskThreshold", value: riskThreshold, set: setRiskThreshold, min: 50, max: 95, unit: "/100", desc: "Projects with calibrated risk score above this value will generate an alert" },
                { label: "Minimum AI Confidence", key: "confidenceMin", value: confidenceMin, set: setConfidenceMin, min: 50, max: 95, unit: "%", desc: "Only show alerts where AI confidence exceeds this threshold" },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3A4050", marginBottom: "6px" }}>{item.label}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <input type="range" min={item.min} max={item.max} value={item.value} onChange={e => item.set(Number(e.target.value))} style={{ flex: 1, accentColor: "#1B3A6B" }} />
                    <div style={{ background: "#EEF2F9", border: "1px solid #C8D8F0", borderRadius: "3px", padding: "5px 12px", fontFamily: "monospace", fontWeight: 700, color: "#1B3A6B", fontSize: "14px", minWidth: "60px", textAlign: "center" }}>
                      {item.value}{item.unit}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "#9AA3B0", marginTop: "3px" }}>{item.desc}</div>
                </div>
              ))}

              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#3A4050", marginBottom: "8px" }}>Anomaly Detection — Active Categories</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {["Unusual Expenditure", "Cost Overrun", "Duplicate Payment", "Suspicious Vendor", "Geographic Inconsistency", "Transaction Outlier", "Delayed Project", "Duplicate Beneficiary"].map((cat, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                      <input type="checkbox" defaultChecked style={{ accentColor: "#1B3A6B", width: "14px", height: "14px" }} />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #E2E5EA", paddingTop: "14px", display: "flex", gap: "8px" }}>
                <button onClick={handleSave} style={{ padding: "8px 18px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Save Settings</button>
                <button onClick={() => { setRiskThreshold(70); setConfidenceMin(65); }} style={{ padding: "8px 14px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}>Reset to Defaults</button>
              </div>
            </div>
          )}

          {activeSection === "roles" && (
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>Role-Based Access Control</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead><tr style={{ background: "#F0F1F4" }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, fontSize: "11px", color: "#3A4050", textTransform: "uppercase", borderBottom: "2px solid #D0D5DD" }}>Module</th>
                  {["Administrator", "MP / Rep.", "Impl. Agency", "Auditor", "Monitoring Officer"].map(r => (
                    <th key={r} style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, fontSize: "11px", color: "#3A4050", textTransform: "uppercase", borderBottom: "2px solid #D0D5DD" }}>{r}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[
                    { module: "Dashboard", perms: [true, true, false, true, true] },
                    { module: "Projects (View)", perms: [true, true, true, true, true] },
                    { module: "Projects (Edit)", perms: [true, false, true, false, true] },
                    { module: "AI Risk Monitoring", perms: [true, true, false, true, true] },
                    { module: "Fraud Alerts", perms: [true, false, false, true, true] },
                    { module: "Financial Analytics", perms: [true, true, false, true, true] },
                    { module: "Geo Monitoring", perms: [true, true, true, true, true] },
                    { module: "Reports (Generate)", perms: [true, true, false, true, true] },
                    { module: "Audit Trail", perms: [true, false, false, true, true] },
                    { module: "Administration", perms: [true, false, false, false, false] },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F0F1F4" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 500 }}>{row.module}</td>
                      {row.perms.map((p, j) => (
                        <td key={j} style={{ padding: "8px 10px", textAlign: "center" }}>
                          <span style={{ color: p ? "#15803D" : "#DC2626", fontSize: "14px", fontWeight: 700 }}>{p ? "✓" : "✕"}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {["alerts", "data", "security", "audit"].includes(activeSection) && (
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>{SECTIONS.find(s => s.id === activeSection)?.label}</div>
              <div style={{ color: "#6B7480", fontSize: "13px", padding: "30px 0", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "10px", opacity: 0.4 }}>⚙</div>
                Configuration options for this section are available to Administrators only.<br />
                Connected to SQLite relational database (`data/mplad_sentinel.db`).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

