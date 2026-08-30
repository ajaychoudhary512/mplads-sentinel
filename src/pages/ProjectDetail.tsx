import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface ProjectDetailProps {
  project: any;
  onNavigate: (page: any, data?: any) => void;
}

const FINANCIAL_DATA = [
  { stage: "Q1", approved: 12.0, utilized: 8.5 },
  { stage: "Q2", approved: 12.0, utilized: 11.8 },
  { stage: "Q3", approved: 12.5, utilized: 14.2 },
  { stage: "Q4 (Est.)", approved: 12.0, utilized: 7.6 },
];

const TRANSACTIONS = [
  { id: "TXN-2026-004821", date: "24 Aug 2026", type: "Works Payment", amount: 18.4, vendor: "M/s Sharma Constructions", status: "Flagged" },
  { id: "TXN-2026-003914", date: "12 Aug 2026", type: "Material Supply", amount: 8.2, vendor: "M/s Sharma Constructions", status: "Normal" },
  { id: "TXN-2026-002841", date: "28 Jul 2026", type: "Labour Payment", amount: 5.1, vendor: "Contractor Labour", status: "Normal" },
  { id: "TXN-2026-001928", date: "10 Jul 2026", type: "Equipment Hire", amount: 3.8, vendor: "M/s Equipment Rentals", status: "Normal" },
  { id: "TXN-2026-001204", date: "22 Jun 2026", type: "Works Payment", amount: 6.6, vendor: "M/s Sharma Constructions", status: "Normal" },
];

const AI_FACTORS = [
  { label: "Cost Anomaly", score: 24, desc: "Expenditure 31% above comparable projects" },
  { label: "Delayed Progress", score: 18, desc: "Physical progress 22% below financial progress" },
  { label: "Vendor Pattern", score: 16, desc: "3 other projects show similar billing pattern" },
  { label: "Duplicate Transaction Indicator", score: 14, desc: "Invoice duplication detected — 72-hour window" },
  { label: "Geographic Inconsistency", score: 10, desc: "Reported site location vs. inspection records mismatch" },
];

function RiskBadge({ level }: { level: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    Critical: { bg: "#FEE2E2", color: "#DC2626" },
    High: { bg: "#FFEDD5", color: "#EA580C" },
    Medium: { bg: "#FEF3C7", color: "#D97706" },
    Low: { bg: "#DCFCE7", color: "#15803D" },
  };
  const c = cfg[level] || cfg.Low;
  return <span style={{ background: c.bg, color: c.color, padding: "3px 9px", borderRadius: "3px", fontSize: "12px", fontWeight: 700, border: `1px solid ${c.color}30` }}>{level.toUpperCase()}</span>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", border: "1px solid #D0D5DD", borderRadius: "4px", padding: "24px", maxWidth: "480px", width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1B3A6B" }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#9AA3B0" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProjectDetail({ project, onNavigate }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);
  const [auditorAssigned, setAuditorAssigned] = useState(false);
  const [selectedAuditor, setSelectedAuditor] = useState("CAG-Auditor Pradeep Gupta");
  const [actionSuccess, setActionSuccess] = useState("");

  const p = project || {
    id: "MPLAD-2026-00482", name: "Rural Community Health Centre Upgrade",
    district: "Alwar", state: "Rajasthan", status: "Under Implementation",
    risk: 82, riskLevel: "Critical", approved: 48.5, utilized: 42.1,
    completion: 78, agency: "Rajasthan Health Dept.", vendor: "M/s Sharma Constructions Pvt. Ltd.",
    mp: "Shri Ramesh Kumar", constituency: "Alwar", category: "Health",
    startDate: "12 Mar 2025", expectedCompletion: "30 Nov 2026", lastUpdated: "26 Aug 2026",
  };

  const TABS = ["Overview", "Financials", "Timeline", "Documents", "AI Analysis", "Audit Trail"];

  const handleAction = (action: string) => {
    if (action === "Assign Auditor") { setShowAssignModal(true); return; }
    setShowConfirmModal(action);
  };

  const confirmAction = () => {
    setActionSuccess(`Action "${showConfirmModal}" has been recorded and the responsible officer has been notified.`);
    setShowConfirmModal(null);
    setTimeout(() => setActionSuccess(""), 4000);
  };

  return (
    <div>
      {/* Project Header */}
      <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px 20px", marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#1B3A6B", fontWeight: 700, background: "#EEF2F9", padding: "2px 8px", borderRadius: "3px" }}>{p.id}</span>
              <RiskBadge level={p.riskLevel} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#DC2626" }}>Risk Score: {p.risk}/100</span>
            </div>
            <h1 style={{ fontSize: "17px", fontWeight: 700, color: "#1A1D23", margin: "0 0 4px 0" }}>{p.name}</h1>
            <div style={{ fontSize: "12px", color: "#6B7480" }}>
              {p.district}, {p.state} · MP: {p.mp} ({p.constituency}) · Category: {p.category}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => handleAction("Investigate")} style={{ padding: "7px 14px", background: "#DC2626", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Investigate</button>
            <button onClick={() => handleAction("Request Verification")} style={{ padding: "7px 14px", background: "#EA580C", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Request Verification</button>
            <button onClick={() => handleAction("Assign Auditor")} style={{ padding: "7px 14px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              {auditorAssigned ? "✓ Auditor Assigned" : "Assign Auditor"}
            </button>
            <button onClick={() => onNavigate("reports")} style={{ padding: "7px 14px", background: "#fff", color: "#3A4050", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}>Generate Report</button>
          </div>
        </div>

        {actionSuccess && (
          <div style={{ marginTop: "12px", background: "#DCFCE7", border: "1px solid #15803D", borderRadius: "3px", padding: "8px 12px", fontSize: "12px", color: "#15803D" }}>
            ✓ {actionSuccess}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #E2E5EA", marginBottom: "14px", background: "#fff", borderRadius: "3px 3px 0 0", overflow: "hidden", border: "1px solid #E2E5EA" }}>
        {TABS.map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab.toLowerCase().replace(" ", "-"))}
            style={{
              padding: "10px 18px", background: "none", border: "none", borderBottom: activeTab === tab.toLowerCase().replace(" ", "-") ? "2px solid #1B3A6B" : "2px solid transparent",
              color: activeTab === tab.toLowerCase().replace(" ", "-") ? "#1B3A6B" : "#6B7480",
              fontWeight: activeTab === tab.toLowerCase().replace(" ", "-") ? 700 : 400,
              cursor: "pointer", fontSize: "13px", marginBottom: "-2px", transition: "all 0.15s"
            }}>
            {tab}
            {tab === "AI Analysis" && <span style={{ marginLeft: "5px", background: "#DC2626", color: "#fff", borderRadius: "10px", padding: "1px 5px", fontSize: "9px", fontWeight: 700 }}>!</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#3A4050", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "12px", borderBottom: "1px solid #F0F1F4", paddingBottom: "8px" }}>Financial Overview</div>
            {[
              { label: "Approved Amount", value: `₹${p.approved} Cr` },
              { label: "Released Amount", value: `₹${(p.approved * 0.9).toFixed(1)} Cr` },
              { label: "Utilised Amount", value: `₹${p.utilized} Cr` },
              { label: "Remaining Amount", value: `₹${(p.approved - p.utilized).toFixed(1)} Cr` },
              { label: "Utilisation Rate", value: `${((p.utilized / p.approved) * 100).toFixed(1)}%` },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F7F8FA", fontSize: "13px" }}>
                <span style={{ color: "#6B7480" }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: "#1A1D23", fontFamily: "monospace" }}>{row.value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#3A4050", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "12px", borderBottom: "1px solid #F0F1F4", paddingBottom: "8px" }}>Project Details</div>
            {[
              { label: "Implementing Agency", value: p.agency },
              { label: "Primary Contractor", value: p.vendor },
              { label: "Date of Sanction", value: p.startDate },
              { label: "Expected Completion", value: p.expectedCompletion },
              { label: "Physical Progress", value: `${p.completion}%` },
              { label: "Status", value: p.status },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F7F8FA", fontSize: "13px", gap: "10px" }}>
                <span style={{ color: "#6B7480", flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontWeight: 500, color: "#1A1D23", textAlign: "right" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "financials" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "14px" }}>
          <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", marginBottom: "4px" }}>Budget vs Actual Expenditure</div>
            <div style={{ fontSize: "11px", color: "#9AA3B0", marginBottom: "12px" }}>Quarter-wise breakdown | FY 2025–26</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={FINANCIAL_DATA} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F4" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" Cr" />
                <Tooltip formatter={(v) => [`₹${v} Cr`, ""]} contentStyle={{ fontSize: "12px", borderRadius: "3px" }} />
                <Bar dataKey="approved" name="Approved (₹ Cr)" fill="#1B3A6B" radius={[2,2,0,0]} />
                <Bar dataKey="utilized" name="Utilised (₹ Cr)" fill="#EA580C" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: "8px", padding: "8px", background: "#FEF3C7", borderRadius: "3px", fontSize: "11px", color: "#D97706", display: "flex", gap: "6px" }}>
              <span>⚠</span>
              <span>Q3 expenditure (₹14.2 Cr) exceeds quarterly approved budget (₹12.5 Cr) by 13.6%</span>
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", marginBottom: "12px" }}>Transaction History</div>
            <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F0F1F4" }}>
                  <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 700, color: "#3A4050", fontSize: "10px", textTransform: "uppercase" }}>Transaction ID</th>
                  <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 700, color: "#3A4050", fontSize: "10px", textTransform: "uppercase" }}>Amount</th>
                  <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 700, color: "#3A4050", fontSize: "10px", textTransform: "uppercase" }}>Date</th>
                  <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 700, color: "#3A4050", fontSize: "10px", textTransform: "uppercase" }}>Flag</th>
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.map((t, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F0F1F4" }}>
                    <td style={{ padding: "7px 8px", fontFamily: "monospace", fontSize: "10px", color: "#1B3A6B" }}>{t.id}</td>
                    <td style={{ padding: "7px 8px", fontFamily: "monospace", fontWeight: 600 }}>₹{t.amount}L</td>
                    <td style={{ padding: "7px 8px", color: "#6B7480" }}>{t.date}</td>
                    <td style={{ padding: "7px 8px" }}>
                      {t.status === "Flagged"
                        ? <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "2px 6px", borderRadius: "3px", fontSize: "10px", fontWeight: 700 }}>FLAGGED</span>
                        : <span style={{ background: "#DCFCE7", color: "#15803D", padding: "2px 6px", borderRadius: "3px", fontSize: "10px", fontWeight: 700 }}>NORMAL</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", marginBottom: "20px" }}>Project Implementation Timeline</div>
          <div style={{ position: "relative", paddingLeft: "32px" }}>
            {[
              { label: "Administrative Approval", date: "10 Feb 2025", done: true, detail: "Project sanctioned by MoSPI. File No. MPLAD/RJ/2025/00482" },
              { label: "Fund Released (1st Instalment)", date: "12 Mar 2025", done: true, detail: "₹24.25 Cr (50% of approved amount) released to implementing agency" },
              { label: "Work Commenced", date: "01 Apr 2025", done: true, detail: "Foundation work and site preparation initiated. Contractor mobilised." },
              { label: "Mid-term Inspection", date: "15 Aug 2025", done: true, detail: "Physical progress at 38%. Financial utilisation at 52%. Variance flagged." },
              { label: "Fund Released (2nd Instalment)", date: "20 Sep 2025", done: true, detail: "₹19.40 Cr released against 50% utilisation certificate" },
              { label: "AI Risk Flag Raised", date: "26 Aug 2026", done: true, color: "#DC2626", detail: "AI Risk Score elevated to 82/100. Duplicate billing indicator detected." },
              { label: "Pending: Field Verification", date: "Expected: Sep 2026", done: false, detail: "Physical inspection and financial verification pending" },
              { label: "Pending: Project Completion", date: "Target: 30 Nov 2026", done: false, detail: "Final completion certificate and utilisation certificate to be filed" },
            ].map((step, i) => (
              <div key={i} style={{ position: "relative", marginBottom: "20px" }}>
                <div style={{ position: "absolute", left: "-32px", top: "2px", width: "16px", height: "16px", borderRadius: "50%", background: !step.done ? "#E2E5EA" : step.color || "#1B3A6B", border: `2px solid ${!step.done ? "#C8CDD6" : step.color || "#1B3A6B"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {step.done && <span style={{ color: "#fff", fontSize: "8px", fontWeight: 700 }}>{step.color ? "!" : "✓"}</span>}
                </div>
                {i < 7 && <div style={{ position: "absolute", left: "-25px", top: "18px", width: "2px", height: "calc(100% + 4px)", background: "#E2E5EA" }} />}
                <div style={{ marginLeft: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: step.done ? (step.color || "#1A1D23") : "#9AA3B0" }}>{step.label}</span>
                    <span style={{ fontSize: "11px", color: "#9AA3B0", fontFamily: "monospace" }}>{step.date}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>{step.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "14px" }}>Project Documents</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead><tr style={{ background: "#F0F1F4" }}>
              {["Document Name", "Type", "Uploaded By", "Date", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, fontSize: "11px", color: "#3A4050", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {[
                { name: "Administrative Approval Order", type: "Sanction Letter", by: "MoSPI Admin", date: "10 Feb 2025", status: "Verified" },
                { name: "Detailed Project Report (DPR)", type: "Technical Report", by: "Rajasthan Health Dept.", date: "20 Feb 2025", status: "Verified" },
                { name: "Work Order – M/s Sharma Constructions", type: "Work Order", by: "District Admin", date: "22 Mar 2025", status: "Verified" },
                { name: "Mid-term Inspection Report", type: "Inspection", by: "Monitoring Officer", date: "15 Aug 2025", status: "Verified" },
                { name: "Utilisation Certificate (UC-1)", type: "Financial", by: "Finance Officer", date: "18 Sep 2025", status: "Verified" },
                { name: "Invoice #INV-2026-4821 (Flagged)", type: "Invoice", by: "M/s Sharma Constructions", date: "24 Aug 2026", status: "Under Review" },
              ].map((d, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F0F1F4" }}>
                  <td style={{ padding: "9px 10px", fontWeight: 500 }}>{d.name}</td>
                  <td style={{ padding: "9px 10px", color: "#6B7480" }}>{d.type}</td>
                  <td style={{ padding: "9px 10px", color: "#6B7480" }}>{d.by}</td>
                  <td style={{ padding: "9px 10px", fontFamily: "monospace", fontSize: "11px" }}>{d.date}</td>
                  <td style={{ padding: "9px 10px" }}>
                    <span style={{ background: d.status === "Verified" ? "#DCFCE7" : "#FEF3C7", color: d.status === "Verified" ? "#15803D" : "#D97706", padding: "2px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: 600 }}>{d.status}</span>
                  </td>
                  <td style={{ padding: "9px 10px" }}>
                    <button style={{ padding: "3px 8px", background: "#EEF2F9", color: "#1B3A6B", border: "1px solid #C8D8F0", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "ai-analysis" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Risk Score */}
            <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ background: "#DC2626", color: "#fff", padding: "3px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em" }}>AI ANALYSIS</div>
                <span style={{ fontSize: "11px", color: "#9AA3B0" }}>Model v2.4 · Confidence: 94%</span>
              </div>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "42px", fontWeight: 700, color: "#DC2626", lineHeight: 1, fontFamily: "monospace" }}>82</div>
                  <div style={{ fontSize: "11px", color: "#9AA3B0" }}>Risk Score / 100</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: "12px", background: "#E2E5EA", borderRadius: "6px", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{ height: "100%", width: "82%", background: "linear-gradient(90deg, #D97706 0%, #EA580C 60%, #DC2626 100%)", borderRadius: "6px" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#9AA3B0" }}>
                    <span>Low (0–30)</span><span>Medium (31–60)</span><span>High (61–80)</span><span>Critical (81+)</span>
                  </div>
                </div>
              </div>
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "3px", padding: "10px 12px", fontSize: "12px", color: "#991B1B" }}>
                <strong>AI Finding:</strong> Potential cost inflation detected. Expenditure increased by 31% during final implementation stage while physical progress increased by only 12%. Similar billing patterns were detected in 3 other projects associated with this vendor.
              </div>
            </div>

            {/* Risk Factor Breakdown */}
            <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Risk Factor Breakdown</div>
              {AI_FACTORS.map((f, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                    <span style={{ fontWeight: 500, color: "#1A1D23" }}>{f.label}</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#DC2626" }}>+{f.score}</span>
                  </div>
                  <div style={{ height: "6px", background: "#F0F1F4", borderRadius: "3px", overflow: "hidden", marginBottom: "2px" }}>
                    <div style={{ height: "100%", width: `${(f.score / 24) * 100}%`, background: "#DC2626", opacity: 0.6 + (f.score / 80), borderRadius: "3px" }} />
                  </div>
                  <div style={{ fontSize: "10px", color: "#9AA3B0" }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Evidence */}
            <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Evidence & Supporting Data</div>
              {[
                "Current project cost is 28% above similar projects in same category",
                "Vendor M/s Sharma Constructions has handled 7 similar projects",
                "3 associated projects show identical expenditure pattern in Q3",
                "Physical progress (78%) is significantly lower than financial utilisation (86.8%)",
                "Invoice INV-2026-4821 duplicates line items from INV-2026-003914",
                "GPS coordinates of site differ from reported location by 0.8 km",
              ].map((e, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "7px", fontSize: "12px" }}>
                  <span style={{ color: "#EA580C", fontWeight: 700, flexShrink: 0 }}>•</span>
                  <span style={{ color: "#3A4050" }}>{e}</span>
                </div>
              ))}
              <button style={{ marginTop: "8px", padding: "6px 12px", background: "#EEF2F9", color: "#1B3A6B", border: "1px solid #C8D8F0", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>View Supporting Data →</button>
            </div>

            {/* Historical Comparison */}
            <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Historical Comparison</div>
              <div style={{ fontSize: "12px", color: "#6B7480", marginBottom: "10px" }}>Similar Health category projects in Rajasthan (FY 2025–26)</div>
              {[
                { label: "Average project cost", this: "₹48.5 Cr", avg: "₹37.8 Cr", flag: true },
                { label: "Average utilisation at 78% completion", this: "86.8%", avg: "71.2%", flag: true },
                { label: "Vendor anomaly flags", this: "4", avg: "0.3", flag: true },
                { label: "Days since last inspection", this: "91 days", avg: "42 days", flag: false },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 0", borderBottom: "1px solid #F7F8FA", fontSize: "12px" }}>
                  <span style={{ flex: 1, color: "#6B7480" }}>{r.label}</span>
                  <span style={{ fontWeight: 700, color: r.flag ? "#DC2626" : "#1A1D23", fontFamily: "monospace" }}>{r.this}</span>
                  <span style={{ color: "#9AA3B0", fontSize: "11px" }}>vs {r.avg}</span>
                  {r.flag && <span style={{ color: "#DC2626", fontSize: "12px" }}>↑</span>}
                </div>
              ))}
            </div>

            {/* Recommended Action */}
            <div style={{ background: "#EEF2F9", border: "1px solid #C8D8F0", borderRadius: "3px", padding: "14px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#1B3A6B", marginBottom: "8px" }}>AI Recommended Action</div>
              <div style={{ fontSize: "12px", color: "#3A4050", marginBottom: "10px" }}>
                Request financial verification and field inspection. The AI recommends investigation — this does not constitute a finding of fraud. Human verification is required before any administrative action.
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => handleAction("Request Verification")} style={{ padding: "6px 12px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Request Verification</button>
                <button onClick={() => setShowAssignModal(true)} style={{ padding: "6px 12px", background: "#fff", color: "#1B3A6B", border: "1px solid #1B3A6B", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>Assign Auditor</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "audit-trail" && (
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "14px" }}>Project Audit Trail — {p.id}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead><tr style={{ background: "#F0F1F4" }}>
              {["Timestamp", "User / Role", "Action", "Old Value", "New Value"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, fontSize: "11px", color: "#3A4050", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {[
                { ts: "27 Aug 2026, 09:14", user: "Joint Secretary", role: "Administrator", action: "Assigned Auditor", old: "Unassigned", new: "CAG-Auditor P. Gupta" },
                { ts: "26 Aug 2026, 11:42", user: "R.K. Sharma", role: "Monitoring Officer", action: "Updated Project Status", old: "Under Implementation", new: "Verification Required" },
                { ts: "26 Aug 2026, 10:30", user: "AI Engine", role: "System", action: "AI Risk Analysis", old: "Risk: 65", new: "Risk: 82" },
                { ts: "15 Aug 2026, 02:20", user: "Finance Officer", role: "Finance Officer", action: "Flagged Transaction", old: "Normal", new: "Under Review" },
                { ts: "12 Aug 2026, 04:00", user: "District Admin", role: "Implementing Agency", action: "Progress Update", old: "72%", new: "78%" },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F0F1F4" }}>
                  <td style={{ padding: "9px 10px", fontFamily: "monospace", fontSize: "11px", color: "#6B7480" }}>{row.ts}</td>
                  <td style={{ padding: "9px 10px" }}>
                    <div style={{ fontWeight: 500 }}>{row.user}</div>
                    <div style={{ fontSize: "10px", color: "#9AA3B0" }}>{row.role}</div>
                  </td>
                  <td style={{ padding: "9px 10px", fontWeight: 500 }}>{row.action}</td>
                  <td style={{ padding: "9px 10px", color: "#6B7480", fontSize: "11px" }}>{row.old}</td>
                  <td style={{ padding: "9px 10px", fontSize: "11px", fontWeight: 500, color: "#1B3A6B" }}>{row.new}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Auditor Modal */}
      {showAssignModal && (
        <Modal title="Assign Auditor — MPLAD-2026-00482" onClose={() => setShowAssignModal(false)}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3A4050", marginBottom: "5px" }}>Select Auditor <span style={{ color: "#DC2626" }}>*</span></label>
            <select value={selectedAuditor} onChange={e => setSelectedAuditor(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "13px" }}>
              <option>CAG-Auditor Pradeep Gupta</option>
              <option>CAG-Auditor Sunita Verma</option>
              <option>State Auditor R.P. Meena</option>
              <option>Internal Auditor A.K. Jain</option>
            </select>
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3A4050", marginBottom: "5px" }}>Assignment Remarks</label>
            <textarea placeholder="Reason for assignment and investigation scope..." rows={3} style={{ width: "100%", padding: "8px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", resize: "none" }} />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3A4050", marginBottom: "5px" }}>Priority</label>
            <select style={{ width: "100%", padding: "8px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "13px" }}>
              <option>Critical — Immediate Action Required</option>
              <option>High — Within 3 Working Days</option>
              <option>Medium — Within 7 Working Days</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowAssignModal(false)} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "3px", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
            <button onClick={() => { setAuditorAssigned(true); setShowAssignModal(false); setActionSuccess(`Auditor ${selectedAuditor} has been assigned to MPLAD-2026-00482. Notification sent.`); }} style={{ padding: "8px 16px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Assign Auditor</button>
          </div>
        </Modal>
      )}

      {/* Confirm Action Modal */}
      {showConfirmModal && (
        <Modal title={`Confirm: ${showConfirmModal}`} onClose={() => setShowConfirmModal(null)}>
          <div style={{ fontSize: "13px", color: "#3A4050", marginBottom: "16px" }}>
            You are about to perform: <strong>{showConfirmModal}</strong> on project {p.id}.<br /><br />
            This action will be recorded in the audit trail and the relevant officers will be notified. Please confirm to proceed.
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowConfirmModal(null)} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "3px", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
            <button onClick={confirmAction} style={{ padding: "8px 16px", background: "#DC2626", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Confirm Action</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
