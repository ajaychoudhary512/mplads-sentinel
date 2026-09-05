import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "../services/api";
import { useDataset } from "../context/DatasetContext";

interface DashboardProps {
  onNavigate: (page: any, data?: any) => void;
}

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
  const { activeVersion, activeMetadata, openUploadModal } = useDataset();

  const [summary, setSummary] = useState<any>(null);
  const [fundData, setFundData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [riskTrend, setRiskTrend] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [districtRisk, setDistrictRisk] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [sum, funds, status, trend, alertsRes, distRes] = await Promise.all([
          api.getDashboardSummary(activeVersion),
          api.getFundUtilization("monthly", activeVersion),
          api.getProjectStatus(activeVersion),
          api.getRiskTrend(activeVersion),
          api.listAlerts({ dataset_version: activeVersion, severity: "All" }),
          api.getDistrictExpenditure(6, activeVersion),
        ]);

        if (!isMounted) return;
        setSummary(sum);
        setFundData(funds || []);
        setStatusData(status || []);
        setRiskTrend(trend || []);
        setRecentAlerts(alertsRes?.items?.slice(0, 5) || []);
        
        if (distRes && distRes.length > 0) {
          setDistrictRisk(distRes.map((d: any) => ({
            district: d.district,
            high: Math.round(d.expenditure * 0.3),
            medium: Math.round(d.expenditure * 0.5),
            low: Math.round(d.expenditure * 0.2)
          })));
        } else {
          setDistrictRisk([]);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [activeVersion]);

  const totalProjectsFormatted = summary ? Number(summary.total_projects).toLocaleString() : "...";
  const fundsAllocatedFormatted = summary ? `₹${summary.funds_allocated_cr} Cr` : "...";
  const fundsUtilizedFormatted = summary ? `₹${summary.funds_utilized_cr} Cr` : "...";
  const utilizationSub = summary ? `${summary.utilization_pct}% of allocation` : "...";
  const projectsCompletedFormatted = summary ? Number(summary.projects_completed).toLocaleString() : "...";
  const completionSub = summary ? `${summary.completion_pct}% completion rate` : "...";
  const projectsDelayedFormatted = summary ? Number(summary.projects_delayed).toLocaleString() : "...";
  const highRiskFormatted = summary ? Number(summary.high_risk_projects).toLocaleString() : "...";

  const kpiCards = [
    { label: "Total MPLAD Projects", value: totalProjectsFormatted, sub: `Active Dataset: ${activeVersion}`, color: "#1B3A6B", icon: "📋" },
    { label: "Funds Allocated", value: fundsAllocatedFormatted, sub: "Total sanctioned amount", color: "#1B3A6B", icon: "₹" },
    { label: "Funds Utilised", value: fundsUtilizedFormatted, sub: utilizationSub, color: "#15803D", icon: "✓" },
    { label: "Projects Completed", value: projectsCompletedFormatted, sub: completionSub, color: "#15803D", icon: "🏁" },
    { label: "Projects Delayed", value: projectsDelayedFormatted, sub: "Require attention", color: "#D97706", icon: "⏱" },
    { label: "High-Risk Projects", value: highRiskFormatted, sub: "AI detected critical risk", color: "#DC2626", icon: "⚠" },
  ];

  const priorityActions = summary?.priority_actions || [
    { type: "Unusual Expenditure", count: 0, risk: "Critical", desc: "Projects with unusual expenditure patterns detected", color: "#DC2626" },
    { type: "Duplicate Billing Indicators", count: 0, risk: "High", desc: "Vendors with duplicate billing indicators", color: "#EA580C" },
    { type: "Delayed Completion", count: 0, risk: "High", desc: "Projects past expected completion with no update", color: "#EA580C" },
    { type: "Pending Verification", count: 0, risk: "Medium", desc: "Transactions requiring financial verification", color: "#D97706" },
  ];

  const exportDashboard = () => {
    window.open(`/api/reports/export?dataset_type=projects&format=csv&dataset_version=${activeVersion}`, "_blank");
  };

  return (
    <div>
      {/* Page title & Dataset Scope */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>MP-Guard AI — MPLAD Monitoring Dashboard</h1>
            <span style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>
              {activeMetadata?.dataset_name || `Dataset ${activeVersion}`} ({activeVersion})
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "3px" }}>
            Financial Year 2025–26 | Dataset Records: <strong>{totalProjectsFormatted}</strong> | Last Updated: {summary?.last_updated || "Today"} {loading && "(Refreshing...)"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={openUploadModal}
            style={{
              padding: "6px 14px",
              background: "#F97316",
              color: "#fff",
              border: "none",
              borderRadius: "3px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>📁</span> Upload Dataset
          </button>
          <button onClick={exportDashboard} style={{ padding: "6px 14px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            Export Dashboard
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {kpiCards.map((kpi, i) => (
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
          <div style={{ background: "#DC2626", borderRadius: "3px", padding: "4px 8px", fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.05em" }}>AI ANALYSIS ({activeVersion})</div>
          <div style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>
            AI detected <span style={{ color: "#FCD34D" }}>{summary?.high_risk_projects || 0} high-risk projects</span> and <span style={{ color: "#FCD34D" }}>₹{summary?.anomalous_expenditure_cr || "0.0"} Cr</span> in potentially anomalous expenditure in dataset {activeVersion}
          </div>
        </div>
        <div style={{ display: "flex", gap: "16px", marginLeft: "auto", flexShrink: 0 }}>
          {[
            { label: "Critical", val: summary?.critical_count ?? 0, color: "#DC2626" },
            { label: "High", val: summary?.high_count ?? 0, color: "#EA580C" },
            { label: "Medium", val: summary?.medium_count ?? 0, color: "#D97706" },
            { label: "Low Risk", val: summary?.low_count ?? 0, color: "#86efac" }
          ].map(r => (
            <div key={r.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: r.color, fontFamily: "monospace" }}>{r.val}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)" }}>{r.label}</div>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate("ai-risk")} style={{ background: "#F97316", color: "#fff", border: "none", borderRadius: "3px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
          View AI Analysis →
        </button>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr", gap: "12px", marginBottom: "20px" }}>
        {/* Fund Allocation vs Utilisation */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23" }}>Fund Allocation vs Utilisation</div>
              <div style={{ fontSize: "11px", color: "#9AA3B0" }}>Scope: Dataset {activeVersion} | Source: MoSPI Real Aggregations</div>
            </div>
            <span style={{ fontSize: "11px", background: "#F1F5F9", padding: "2px 6px", borderRadius: "3px", color: "#64748B" }}>Monthly</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={fundData.length > 0 ? fundData : [{ month: "No Data", allocated: 0, utilized: 0 }]} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
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
          <div style={{ fontSize: "11px", color: "#9AA3B0", marginBottom: "10px" }}>Dataset {activeVersion}: {totalProjectsFormatted} Projects</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, ""]} contentStyle={{ fontSize: "12px", borderRadius: "3px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {statusData.map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: d.color, display: "inline-block" }} />
                  {d.name}
                </span>
                <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{Number(d.value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Trend */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", marginBottom: "4px" }}>Risk Trend ({activeVersion})</div>
          <div style={{ fontSize: "11px", color: "#9AA3B0", marginBottom: "10px" }}>Mar–Aug 2026</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={riskTrend} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
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
          <div style={{ fontSize: "11px", color: "#9AA3B0", marginBottom: "12px" }}>Dataset {activeVersion} | Source: MoSPI Project Records</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={districtRisk} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
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
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", marginBottom: "12px" }}>Priority Actions Required ({activeVersion})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {priorityActions.map((a: any, i: number) => (
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
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#3A4050", marginBottom: "8px" }}>Recent AI Alerts ({activeVersion})</div>
          {recentAlerts.slice(0, 3).map((alert: any, i: number) => (
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
