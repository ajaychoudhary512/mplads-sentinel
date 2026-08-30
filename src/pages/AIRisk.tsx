import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { PROJECTS } from "../data/mockData";

interface AIRiskProps {
  onNavigate: (page: any, data?: any) => void;
}

const ANOMALY_CATEGORIES = [
  { label: "Unusual Expenditure", count: 12, icon: "₹", color: "#DC2626" },
  { label: "Cost Overrun", count: 9, icon: "↑", color: "#EA580C" },
  { label: "Delayed Project", count: 17, icon: "⏱", color: "#D97706" },
  { label: "Duplicate Payment", count: 5, icon: "⧉", color: "#DC2626" },
  { label: "Suspicious Vendor", count: 7, icon: "🏢", color: "#EA580C" },
  { label: "Duplicate Beneficiary", count: 3, icon: "👥", color: "#D97706" },
  { label: "Geographic Inconsistency", count: 4, icon: "📍", color: "#D97706" },
  { label: "Transaction Outlier", count: 8, icon: "⚡", color: "#EA580C" },
];

const RISK_DIST = [
  { name: "Critical", value: 8, color: "#DC2626" },
  { name: "High", value: 35, color: "#EA580C" },
  { name: "Medium", value: 126, color: "#D97706" },
  { name: "Low", value: 1115, color: "#86AFDF" },
];

const ANOMALY_TABLE = [
  { project: "MPLAD-2026-00482", name: "Rural Health Centre Upgrade", type: "Cost Anomaly", confidence: 94, score: 82, detected: "26 Aug 2026", status: "Under Investigation" },
  { project: "MPLAD-2026-00317", name: "Rural Road Development Ph-II", type: "Expenditure-Progress Mismatch", confidence: 91, score: 67, detected: "25 Aug 2026", status: "Pending Review" },
  { project: "MPLAD-2026-00156", name: "Panchayat Bhawan Construction", type: "Cost Overrun", confidence: 88, score: 73, detected: "24 Aug 2026", status: "Pending Review" },
  { project: "MPLAD-2026-00284", name: "Drinking Water Infrastructure", type: "Suspicious Vendor", confidence: 84, score: 54, detected: "23 Aug 2026", status: "Under Review" },
  { project: "MPLAD-2026-00178", name: "Solar Street Lighting Project", type: "Transaction Outlier", confidence: 79, score: 38, detected: "22 Aug 2026", status: "Resolved" },
  { project: "MPLAD-2026-00129", name: "Agricultural Market Development", type: "Delayed Reporting", confidence: 65, score: 8, detected: "19 Aug 2026", status: "Resolved" },
];

function RiskBadge({ score }: { score: number }) {
  const level = score >= 81 ? "Critical" : score >= 61 ? "High" : score >= 31 ? "Medium" : "Low";
  const cfg: Record<string, { bg: string; color: string }> = {
    Critical: { bg: "#FEE2E2", color: "#DC2626" },
    High: { bg: "#FFEDD5", color: "#EA580C" },
    Medium: { bg: "#FEF3C7", color: "#D97706" },
    Low: { bg: "#DCFCE7", color: "#15803D" },
  };
  const c = cfg[level];
  return <span style={{ background: c.bg, color: c.color, padding: "2px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: 700 }}>{score} {level.toUpperCase()}</span>;
}

export function AIRisk({ onNavigate }: AIRiskProps) {
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const [filterType, setFilterType] = useState("All Types");
  const [dateFrom, setDateFrom] = useState("2026-08-01");
  const [dateTo, setDateTo] = useState("2026-08-27");

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => { setRunning(false); setRan(true); }, 2000);
  };

  const filtered = ANOMALY_TABLE.filter(r => filterType === "All Types" || r.type === filterType);
  const types = ["All Types", ...Array.from(new Set(ANOMALY_TABLE.map(r => r.type)))];

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>AI Risk Intelligence</h1>
        <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>AI-Based Anomaly Detection & Risk Scoring | Financial Year 2025–26</div>
      </div>

      {/* Controls */}
      <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "14px", marginBottom: "14px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#6B7480", marginBottom: "4px" }}>Date From</div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px" }} />
        </div>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#6B7480", marginBottom: "4px" }}>Date To</div>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px" }} />
        </div>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#6B7480", marginBottom: "4px" }}>Anomaly Type</div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", minWidth: "180px", background: "#fff" }}>
            {types.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#6B7480", marginBottom: "4px" }}>District</div>
          <select style={{ padding: "6px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", minWidth: "130px", background: "#fff" }}>
            <option>All Districts</option>
            <option>Alwar</option>
            <option>Bikaner</option>
            <option>Barmer</option>
          </select>
        </div>
        <button onClick={handleRun} disabled={running} style={{ padding: "7px 18px", background: running ? "#9AA3B0" : "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", fontWeight: 600, cursor: running ? "not-allowed" : "pointer", alignSelf: "flex-end", display: "flex", alignItems: "center", gap: "6px" }}>
          {running ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>↻</span> Running AI Analysis...</> : "▶ Run AI Analysis"}
        </button>
        <button style={{ padding: "7px 12px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", cursor: "pointer", alignSelf: "flex-end" }}>Upload Dataset</button>
      </div>

      {ran && (
        <div style={{ background: "#DCFCE7", border: "1px solid #15803D", borderRadius: "3px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "#15803D", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>✓ AI Analysis completed successfully. 65 projects re-analysed. 3 new anomalies detected. Model v2.4 | Run ID: RUN-2026-0082</span>
          <button onClick={() => setRan(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#15803D", fontSize: "16px" }}>×</button>
        </div>
      )}

      {/* Stats + Chart row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: "12px", marginBottom: "14px" }}>
        {/* Risk Distribution */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Risk Distribution</div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={RISK_DIST} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                {RISK_DIST.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, "Projects"]} contentStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
          {RISK_DIST.map((d, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "3px 0" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: d.color, display: "inline-block" }} />
                {d.name}
              </span>
              <span style={{ fontWeight: 700, fontFamily: "monospace", color: d.color }}>{d.value}</span>
            </div>
          ))}
        </div>

        {/* Anomaly Categories */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Detected Anomaly Categories</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ANOMALY_CATEGORIES} layout="vertical" margin={{ left: 120, right: 30, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: "#3A4050" }} width={120} />
              <Tooltip contentStyle={{ fontSize: "11px" }} />
              <Bar dataKey="count" name="Projects" fill="#1B3A6B" radius={[0, 3, 3, 0]}>
                {ANOMALY_CATEGORIES.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Model Info */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ background: "#1B3A6B", color: "#fff", padding: "3px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", display: "inline-block", marginBottom: "10px" }}>AI MODEL STATUS</div>
          {[
            { label: "Model Version", value: "v2.4.1" },
            { label: "Algorithm", value: "Isolation Forest + XGBoost" },
            { label: "Last Trained", value: "20 Aug 2026" },
            { label: "Training Dataset", value: "Q2 2026 MPLAD Data" },
            { label: "Model Accuracy", value: "94.2%" },
            { label: "False Positive Rate", value: "3.8%" },
            { label: "Projects Analysed", value: "1,284" },
            { label: "Next Scheduled Run", value: "01 Sep 2026" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "5px 0", borderBottom: "1px solid #F7F8FA" }}>
              <span style={{ color: "#6B7480" }}>{r.label}</span>
              <span style={{ fontWeight: 600, color: "#1A1D23", fontFamily: r.label === "Model Version" || r.label === "Model Accuracy" ? "monospace" : "inherit" }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly Table */}
      <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #E2E5EA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "13px", fontWeight: 700 }}>AI Anomaly Detection Results</div>
          <button style={{ padding: "5px 12px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>Export Results</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#F0F1F4" }}>
              {["Project ID", "Project Name", "Anomaly Type", "Confidence", "Risk Score", "Detected On", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "9px 11px", textAlign: "left", fontWeight: 700, fontSize: "11px", color: "#3A4050", textTransform: "uppercase", borderBottom: "2px solid #D0D5DD" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F0F1F4", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#F7F8FA"}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ""}>
                <td style={{ padding: "9px 11px", fontFamily: "monospace", fontSize: "11px", color: "#1B3A6B", fontWeight: 600 }}>{row.project}</td>
                <td style={{ padding: "9px 11px", maxWidth: "180px", fontSize: "12px" }}>{row.name}</td>
                <td style={{ padding: "9px 11px" }}>
                  <span style={{ background: "#FEF3C7", color: "#D97706", padding: "2px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: 600 }}>{row.type}</span>
                </td>
                <td style={{ padding: "9px 11px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "40px", height: "5px", background: "#E2E5EA", borderRadius: "3px" }}>
                      <div style={{ height: "100%", width: `${row.confidence}%`, background: row.confidence > 85 ? "#DC2626" : "#D97706", borderRadius: "3px" }} />
                    </div>
                    <span style={{ fontFamily: "monospace", fontWeight: 600, fontSize: "11px" }}>{row.confidence}%</span>
                  </div>
                </td>
                <td style={{ padding: "9px 11px" }}><RiskBadge score={row.score} /></td>
                <td style={{ padding: "9px 11px", fontFamily: "monospace", fontSize: "11px", color: "#6B7480" }}>{row.detected}</td>
                <td style={{ padding: "9px 11px" }}>
                  <span style={{
                    background: row.status === "Under Investigation" ? "#FEE2E2" : row.status === "Resolved" ? "#DCFCE7" : "#FEF3C7",
                    color: row.status === "Under Investigation" ? "#DC2626" : row.status === "Resolved" ? "#15803D" : "#D97706",
                    padding: "2px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: 600
                  }}>{row.status}</span>
                </td>
                <td style={{ padding: "9px 11px" }}>
                  <button onClick={() => onNavigate("project-detail", PROJECTS.find(p => p.id === row.project))} style={{ padding: "4px 10px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>Investigate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
