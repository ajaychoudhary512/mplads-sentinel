import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MONTHLY_DATA, DISTRICT_RISK, RISK_TREND, PROJECTS, ALERTS } from "../data/mockData";

interface DashboardProps {
  onNavigate: (page: any, data?: any) => void;
}

const COLORS = { low: "#15803D", medium: "#D97706", high: "#EA580C", critical: "#DC2626" };

const KPI_CARDS = [
  { label: "Total MPLAD Projects", value: "1,284", sub: "Financial Year 2025–26", color: "#1B3A6B", icon: "📋" },
  { label: "Funds Allocated", value: "₹482.6 Cr", sub: "Total sanctioned amount", color: "#1B3A6B", icon: "₹" },
  { label: "Funds Utilised", value: "₹391.4 Cr", sub: "81.1% of allocation", color: "#15803D", icon: "✓" },
  { label: "Projects Completed", value: "924", sub: "72.0% completion rate", color: "#15803D", icon: "🏁" },
  { label: "Projects Delayed", value: "117", sub: "Require attention", color: "#D97706", icon: "⏱" },
  { label: "High-Risk Projects", value: "43", sub: "AI detected critical risk", color: "#DC2626", icon: "⚠" },
];

const STATUS_DATA = [
  { name: "Completed", value: 924, color: "#15803D" },
  { name: "Under Implementation", value: 243, color: "#1B3A6B" },
  { name: "Delayed", value: 117, color: "#D97706" },
  { name: "Not Started", value: 0, color: "#9AA3B0" },
];

const PRIORITY_ACTIONS = [
  { type: "Unusual Expenditure", count: 12, risk: "Critical", desc: "Projects with unusual expenditure patterns detected by AI", color: "#DC2626" },
  { type: "Duplicate Billing Indicators", count: 7, risk: "High", desc: "Vendors with duplicate billing indicators across projects", color: "#EA580C" },
  { type: "Delayed Completion", count: 9, risk: "High", desc: "Projects past expected completion with no update", color: "#EA580C" },
  { type: "Pending Verification", count: 15, risk: "Medium", desc: "Transactions requiring financial verification", color: "#D97706" },
];

function RiskBadge({ level }: { level: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    Critical: { bg: "#FEE2E2", color: "#DC2626" },
    High: { bg: "#FFEDD5", color: "#EA580C" },
    Medium: { bg: "#FEF3C7", color: "#D97706" },
    Low: { bg: "#DCFCE7", color: "#15803D" },
  };
  const c = cfg[level] || cfg.Low;
  return (
    <span style={{ background: c.bg, color: c.color, padding: "2px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.03em", border: `1px solid ${c.color}22` }}>
      {level.toUpperCase()}
    </span>
  );
}

export function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>MP-Guard AI — MPLAD Monitoring Dashboard</h1>
          <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "3px" }}>Financial Year 2025–26 | As on 27 August 2026</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <select style={{ padding: "6px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", background: "#fff", color: "#3A4050" }}>
            <option>FY 2025–26</option>
            <option>FY 2024–25</option>
          </select>
          <button style={{ padding: "6px 14px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Export Dashboard</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {KPI_CARDS.map((kpi, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #E2E5EA", borderTop: `3px solid ${kpi.color}`, borderRadius: "3px", padding: "14px", cursor: "pointer" }}
            onClick={() => i === 5 ? onNavigate("ai-risk") : onNavigate("projects")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#6B7480", textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.4, flex: 1 }}>{kpi.label}</div>
              <span style={{ fontSize: "16px" }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: kpi.color, marginTop: "6px", fontFamily: "'JetBrains Mono', monospace" }}>{kpi.value}</div>
            <div style={{ fontSize: "10px", color: "#9AA3B0", marginTop: "3px" }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* AI Risk Summary */}
      <div style={{ background: "#1B3A6B", borderRadius: "4px", padding: "16px 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "#DC2626", borderRadius: "3px", padding: "4px 8px", fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.05em" }}>AI ANALYSIS</div>
          <div style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>AI detected <span style={{ color: "#FCD34D" }}>43 high-risk projects</span> and <span style={{ color: "#FCD34D" }}>₹72.3 Cr</span> in potentially anomalous expenditure requiring attention</div>
        </div>
        <div style={{ display: "flex", gap: "16px", marginLeft: "auto", flexShrink: 0 }}>
          {[{ label: "Critical", val: 8, color: "#DC2626" }, { label: "High", val: 35, color: "#EA580C" }, { label: "Medium", val: 126, color: "#D97706" }, { label: "Low Risk", val: 1115, color: "#86efac" }].map(r => (
            <div key={r.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: r.color, fontFamily: "monospace" }}>{r.val}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)" }}>{r.label}</div>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate("ai-risk")} style={{ background: "#F97316", color: "#fff", border: "none", borderRadius: "3px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>View AI Analysis →</button>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr", gap: "12px", marginBottom: "20px" }}>
        {/* Fund Allocation vs Utilisation */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23" }}>Fund Allocation vs Utilisation</div>
              <div style={{ fontSize: "11px", color: "#9AA3B0" }}>Financial Year 2025–26 | Source: MPLAD Project Records</div>
            </div>
            <select style={{ fontSize: "11px", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "3px 6px", background: "#fff" }}>
              <option>Monthly</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY_DATA} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F4" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9AA3B0" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9AA3B0" }} />
              <Tooltip formatter={(v) => [`₹${v} Cr`, ""]} contentStyle={{ fontSize: "12px", borderRadius: "3px", border: "1px solid #E2E5EA" }} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="allocated" name="Allocated (₹ Cr)" fill="#1B3A6B" radius={[2, 2, 0, 0]} />
              <Bar dataKey="utilized" name="Utilised (₹ Cr)" fill="#86AFDF" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project Status */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", marginBottom: "4px" }}>Project Status Distribution</div>
          <div style={{ fontSize: "11px", color: "#9AA3B0", marginBottom: "10px" }}>Total: 1,284 Projects</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={STATUS_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                {STATUS_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, ""]} contentStyle={{ fontSize: "12px", borderRadius: "3px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {STATUS_DATA.map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: d.color, display: "inline-block" }} />
                  {d.name}
                </span>
                <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Trend */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", marginBottom: "4px" }}>Risk Trend</div>
          <div style={{ fontSize: "11px", color: "#9AA3B0", marginBottom: "10px" }}>Mar–Aug 2026</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={RISK_TREND} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F4" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9AA3B0" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9AA3B0" }} />
              <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "3px", border: "1px solid #E2E5EA" }} />
              <Line type="monotone" dataKey="high" stroke="#EA580C" strokeWidth={2} dot={false} name="High" />
              <Line type="monotone" dataKey="critical" stroke="#DC2626" strokeWidth={2} dot={false} name="Critical" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <span style={{ fontSize: "11px", color: "#DC2626", display: "flex", alignItems: "center", gap: "3px" }}><span>—</span> Critical</span>
            <span style={{ fontSize: "11px", color: "#EA580C", display: "flex", alignItems: "center", gap: "3px" }}><span>—</span> High</span>
          </div>
        </div>
      </div>

      {/* District-wise chart + Priority Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "12px" }}>
        {/* District risk chart */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", marginBottom: "4px" }}>District-wise Risk Distribution</div>
          <div style={{ fontSize: "11px", color: "#9AA3B0", marginBottom: "12px" }}>Financial Year 2025–26 | Source: MPLAD Project Records</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DISTRICT_RISK} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F4" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#9AA3B0" }} />
              <YAxis type="category" dataKey="district" tick={{ fontSize: 10, fill: "#3A4050" }} />
              <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "3px" }} />
              <Bar dataKey="high" name="High Risk" fill="#EA580C" stackId="a" />
              <Bar dataKey="medium" name="Medium" fill="#D97706" stackId="a" />
              <Bar dataKey="low" name="Low Risk" fill="#86AFDF" stackId="a" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Actions */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", marginBottom: "12px" }}>Priority Actions Required</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {PRIORITY_ACTIONS.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#F7F8FA", border: "1px solid #E2E5EA", borderLeft: `3px solid ${a.color}`, borderRadius: "3px", cursor: "pointer" }}
                onClick={() => onNavigate("fraud-alerts")}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "18px", fontWeight: 700, color: a.color, fontFamily: "monospace" }}>{a.count}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#1A1D23" }}>{a.type}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#9AA3B0" }}>{a.desc}</div>
                </div>
                <RiskBadge level={a.risk} />
              </div>
            ))}
          </div>

          {/* Recent Alerts */}
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#3A4050", marginBottom: "8px" }}>Recent AI Alerts</div>
          {ALERTS.slice(0, 3).map((alert, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 0", borderBottom: i < 2 ? "1px solid #F0F1F4" : "none", cursor: "pointer" }}
              onClick={() => onNavigate("fraud-alerts")}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: alert.severity === "Critical" ? "#DC2626" : alert.severity === "High" ? "#EA580C" : "#D97706", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#1A1D23" }}>{alert.anomaly}</div>
                <div style={{ fontSize: "10px", color: "#9AA3B0" }}>{alert.project} · {alert.amount} · Confidence: {alert.confidence}%</div>
              </div>
              <span style={{ fontSize: "10px", color: "#9AA3B0" }}>{alert.date}</span>
            </div>
          ))}
          <button onClick={() => onNavigate("fraud-alerts")} style={{ marginTop: "10px", background: "none", border: "1px solid #1B3A6B", color: "#1B3A6B", borderRadius: "3px", padding: "6px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer", width: "100%" }}>
            View All Alerts →
          </button>
        </div>
      </div>
    </div>
  );
}
