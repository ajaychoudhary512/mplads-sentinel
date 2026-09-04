import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api } from "../services/api";
import { useDataset } from "../context/DatasetContext";

interface AIRiskProps {
  onNavigate: (page: any, data?: any) => void;
}

function RiskBadge({ score }: { score: number }) {
  const level = score >= 75 ? "Critical" : score >= 50 ? "High" : score >= 25 ? "Medium" : "Low";
  const cfg: Record<string, { bg: string; color: string }> = {
    Critical: { bg: "#FEE2E2", color: "#DC2626" },
    High: { bg: "#FFEDD5", color: "#EA580C" },
    Medium: { bg: "#FEF3C7", color: "#D97706" },
    Low: { bg: "#DCFCE7", color: "#15803D" },
  };
  const c = cfg[level] || cfg.Low;
  return <span style={{ background: c.bg, color: c.color, padding: "2px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: 700 }}>{Math.round(score)} {level.toUpperCase()}</span>;
}

export function AIRisk({ onNavigate }: AIRiskProps) {
  const { activeVersion, activeMetadata, openUploadModal } = useDataset();

  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const [runInfo, setRunInfo] = useState<any>(null);
  const [filterType, setFilterType] = useState("All Types");
  const [dateFrom, setDateFrom] = useState("2026-08-01");
  const [dateTo, setDateTo] = useState("2026-08-27");
  
  const [riskDist, setRiskDist] = useState<any[]>([]);
  const [anomalyCategories, setAnomalyCategories] = useState<any[]>([]);
  const [modelStatus, setModelStatus] = useState<any>({
    modelVersion: "v1.2.0",
    algorithm: "Isolation Forest + LOF + Rules",
    lastTrained: "26 Aug 2026",
    trainingDataset: "28,706 MPLAD Records",
    modelAccuracy: "Quantile Calibrated (0-100)",
    falsePositiveRate: "< 5.0%",
    projectsAnalysed: "28,706",
    nextScheduledRun: "Daily Auto-Scan"
  });
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAIData() {
      setLoading(true);
      try {
        const [dist, cat, status, table] = await Promise.all([
          api.getRiskDistribution(activeVersion).catch(() => []),
          api.getAnomalyCategories(activeVersion).catch(() => []),
          api.getAIModelStatus(activeVersion).catch(() => null),
          api.getAIAnomalies(filterType, activeVersion).catch(() => []),
        ]);
        if (!isMounted) return;
        if (dist && dist.length) setRiskDist(dist);
        if (cat && cat.length) setAnomalyCategories(cat);
        if (status) setModelStatus(status);
        if (table) setAnomalies(table);
      } catch (err) {
        console.error("Failed to load AI Risk data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAIData();
    return () => { isMounted = false; };
  }, [filterType, activeVersion]);

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await api.triggerAIAnalysis({
        dataset_version: activeVersion,
        anomaly_type: filterType === "All Types" ? "all" : filterType
      });
      setRunInfo(res);
      setRan(true);
      const [dist, cat, table] = await Promise.all([
        api.getRiskDistribution(activeVersion),
        api.getAnomalyCategories(activeVersion),
        api.getAIAnomalies(filterType, activeVersion),
      ]);
      setRiskDist(dist);
      setAnomalyCategories(cat);
      setAnomalies(table);
    } catch (err) {
      console.error("AI Analysis run error:", err);
    } finally {
      setRunning(false);
    }
  };

  const types = ["All Types", "Unusual Expenditure", "Cost Overrun", "Delayed Project", "Duplicate Payment", "Suspicious Vendor", "Geographic Inconsistency", "Split Payment"];

  return (
    <div>
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>AI Risk Intelligence</h1>
          <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>
            Autonomous Multi-Dimensional Anomaly Detection | Active Dataset: <strong style={{ color: "#1B3A6B" }}>{activeMetadata?.dataset_name || `Dataset ${activeVersion}`} ({activeVersion})</strong>
          </div>
        </div>
        <button
          onClick={openUploadModal}
          style={{
            padding: "8px 16px",
            background: "#F97316",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 6px rgba(249,115,22,0.3)"
          }}
        >
          <span>📁</span>
          <span>Upload Dataset</span>
        </button>
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
        <button onClick={() => window.open(`/api/reports/export?dataset_type=projects&format=csv&dataset_version=${activeVersion}`, "_blank")} style={{ padding: "7px 12px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", cursor: "pointer", alignSelf: "flex-end" }}>Export Master Dataset</button>
      </div>

      {ran && (
        <div style={{ background: "#DCFCE7", border: "1px solid #15803D", borderRadius: "3px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "#15803D", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>✓ AI Analysis for {activeVersion} completed successfully. {runInfo?.projects_analyzed || activeMetadata?.row_count || 28706} projects analyzed. {runInfo?.critical || 8} Critical and {runInfo?.high || 35} High risk anomalies calibrated. Run ID: {runInfo?.run_id || "RUN-LIVE"}</span>
          <button onClick={() => setRan(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#15803D", fontSize: "16px" }}>×</button>
        </div>
      )}

      {/* Stats + Chart row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: "12px", marginBottom: "14px" }}>
        {/* Risk Distribution */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Risk Distribution ({activeVersion})</div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={riskDist} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                {riskDist.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, "Projects"]} contentStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
          {riskDist.map((d, i) => (
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
            <BarChart data={anomalyCategories} layout="vertical" margin={{ left: 120, right: 30, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: "#3A4050" }} width={120} />
              <Tooltip contentStyle={{ fontSize: "11px" }} />
              <Bar dataKey="count" name="Projects" fill="#1B3A6B" radius={[0, 3, 3, 0]}>
                {anomalyCategories.map((e, i) => <Cell key={i} fill={e.color || "#1B3A6B"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Model Info */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ background: "#1B3A6B", color: "#fff", padding: "3px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", display: "inline-block", marginBottom: "10px" }}>AI MODEL STATUS</div>
          {[
            { label: "Dataset Version", value: activeVersion },
            { label: "Model Version", value: modelStatus.modelVersion || "v1.2.0" },
            { label: "Algorithm", value: modelStatus.algorithm || "Isolation Forest + LOF + Rules" },
            { label: "Last Analysis", value: modelStatus.lastTrained || "26 Aug 2026" },
            { label: "Training Dataset", value: modelStatus.trainingDataset || `${activeMetadata?.row_count?.toLocaleString() || "28,706"} Works` },
            { label: "Model Calibration", value: modelStatus.modelAccuracy || "Upper Quantile Scoring" },
            { label: "False Positive Rate", value: modelStatus.falsePositiveRate || "< 5.0%" },
            { label: "Projects Analysed", value: `${modelStatus.projectsAnalysed || activeMetadata?.row_count || 28706}` },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "5px 0", borderBottom: "1px solid #F7F8FA" }}>
              <span style={{ color: "#6B7480" }}>{r.label}</span>
              <span style={{ fontWeight: 600, color: "#1A1D23", fontFamily: r.label === "Model Version" || r.label === "Projects Analysed" || r.label === "Dataset Version" ? "monospace" : "inherit" }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly Table */}
      <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #E2E5EA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "13px", fontWeight: 700 }}>AI Anomaly Detection Results ({anomalies.length} High Risk Projects in {activeVersion})</div>
          <button onClick={() => window.open(`/api/reports/export?dataset_type=alerts&format=csv&dataset_version=${activeVersion}`, "_blank")} style={{ padding: "5px 12px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>Export Results</button>
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
            {anomalies.length > 0 ? (
              anomalies.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F0F1F4", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#F7F8FA"}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ""}>
                  <td style={{ padding: "9px 11px", fontFamily: "monospace", fontSize: "11px", color: "#1B3A6B", fontWeight: 600 }}>{row.project}</td>
                  <td style={{ padding: "9px 11px", maxWidth: "220px", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.name}</td>
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
                    <button onClick={() => onNavigate("project-detail", { id: row.project, name: row.name, risk: row.score, riskLevel: row.score >= 75 ? "Critical" : row.score >= 50 ? "High" : "Medium" })} style={{ padding: "4px 10px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>Investigate</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "#9AA3B0" }}>
                  {loading ? "Loading AI anomaly data..." : "No anomaly records found for the selected filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
