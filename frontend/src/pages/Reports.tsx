import { useState } from "react";
import { api } from "../services/api";
import { useDataset } from "../context/DatasetContext";

export function Reports() {
  const { activeVersion, activeMetadata } = useDataset();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [reportType, setReportType] = useState("AI Risk Report");
  const [reportResult, setReportResult] = useState<any>(null);
  const [form, setForm] = useState({ district: "All Districts", constituency: "All", dateFrom: "2026-04-01", dateTo: "2026-08-27", riskCategory: "All", financialYear: "2025-26" });

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerated(false);
    try {
      const res = await api.generateReport({
        reportType,
        ...form
      }, activeVersion);
      setReportResult(res);
      setGenerated(true);
    } catch (err) {
      console.error("Report generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (format = "csv") => {
    window.open(`/api/reports/export?dataset_type=projects&format=${format}&dataset_version=${encodeURIComponent(activeVersion)}`, "_blank");
  };

  const REPORT_TYPES = [
    "Project Performance Report",
    "Financial Utilisation Report",
    "AI Risk Report",
    "Fraud Investigation Report",
    "District Risk Report",
    "Audit Report",
  ];

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>Report Generation</h1>
        <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>
          Generate and export data-driven analytical reports for MPLAD scheme monitoring | Dataset: <strong>{activeMetadata?.dataset_name || activeVersion}</strong> ({activeMetadata?.valid_row_count ? `${activeMetadata.valid_row_count.toLocaleString()} rows` : activeVersion})
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "14px" }}>
        {/* Report Builder */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", marginBottom: "14px" }}>Report Builder</div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#3A4050", marginBottom: "5px" }}>Report Type <span style={{ color: "#DC2626" }}>*</span></label>
            <select value={reportType} onChange={e => { setReportType(e.target.value); setGenerated(false); }} style={{ width: "100%", padding: "7px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", background: "#fff" }}>
              {REPORT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {[
            { label: "Financial Year", key: "financialYear", options: ["2025-26", "2024-25", "2023-24"], type: "select" },
            { label: "District / State", key: "district", options: ["All Districts", "Rajasthan", "Maharashtra", "Uttar Pradesh", "Kerala", "Telangana", "Madhya Pradesh", "Gujarat", "Punjab"], type: "select" },
            { label: "Constituency", key: "constituency", options: ["All", "Alwar", "Bikaner", "Barmer", "Nagpur", "Ernakulam", "Hyderabad", "Jaipur"], type: "select" },
            { label: "Risk Category", key: "riskCategory", options: ["All", "Critical", "High", "Medium", "Low"], type: "select" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#3A4050", marginBottom: "5px" }}>{f.label}</label>
              <select value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ width: "100%", padding: "7px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", background: "#fff" }}>
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#3A4050", marginBottom: "5px" }}>Date From</label>
              <input type="date" value={form.dateFrom} onChange={e => setForm(prev => ({ ...prev, dateFrom: e.target.value }))} style={{ width: "100%", padding: "7px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#3A4050", marginBottom: "5px" }}>Date To</label>
              <input type="date" value={form.dateTo} onChange={e => setForm(prev => ({ ...prev, dateTo: e.target.value }))} style={{ width: "100%", padding: "7px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px" }} />
            </div>
          </div>

          <button onClick={handleGenerate} disabled={generating} style={{ width: "100%", padding: "9px", background: generating ? "#9AA3B0" : "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "13px", fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", marginBottom: "8px" }}>
            {generating ? "Generating Report..." : "Generate Report"}
          </button>

          {generated && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <button onClick={() => handleDownload("csv")} style={{ padding: "7px", background: "#15803D", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>⬇ Download CSV Dataset</button>
              <button onClick={() => window.open(`/api/reports/export?dataset_type=alerts&format=csv&dataset_version=${encodeURIComponent(activeVersion)}`, "_blank")} style={{ padding: "7px", background: "#fff", color: "#1B3A6B", border: "1px solid #1B3A6B", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}>⬇ Export Risk Summary</button>
              <button onClick={() => alert("Report shared with designated MoSPI Audit Officers.")} style={{ padding: "7px", background: "#fff", color: "#3A4050", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}>📤 Share with Auditor</button>
            </div>
          )}
        </div>

        {/* Report Preview */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          {generating && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", color: "#6B7480" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px", animation: "pulse 1.5s ease-in-out infinite" }}>📊</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#1B3A6B", marginBottom: "6px" }}>Generating Report...</div>
              <div style={{ fontSize: "12px" }}>Compiling data from canonical MPLAD records and AI risk engine</div>
              <div style={{ marginTop: "16px", width: "200px", height: "4px", background: "#E2E5EA", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "60%", background: "#1B3A6B", borderRadius: "4px", animation: "slide 1.5s ease-in-out infinite" }} />
              </div>
            </div>
          )}

          {!generating && !generated && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", color: "#9AA3B0" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px", opacity: 0.4 }}>📋</div>
              <div style={{ fontSize: "13px" }}>Select report parameters and click Generate Report</div>
            </div>
          )}

          {generated && !generating && reportResult && (
            <div>
              {/* Report Header */}
              <div style={{ borderBottom: "2px solid #1B3A6B", paddingBottom: "14px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "#6B7480", letterSpacing: "0.06em", textTransform: "uppercase" }}>Government of India | Ministry of Statistics and Programme Implementation</div>
                    <div style={{ fontSize: "17px", fontWeight: 700, color: "#1B3A6B", marginTop: "4px" }}>{reportResult.reportType}</div>
                    <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>MPLAD Scheme | Financial Year {reportResult.financialYear} | Generated: {reportResult.generatedAt}</div>
                  </div>
                  <div style={{ background: "#F0F1F4", padding: "8px 12px", borderRadius: "3px", textAlign: "right", fontSize: "11px" }}>
                    <div style={{ fontWeight: 700, color: "#1B3A6B" }}>Report ID</div>
                    <div style={{ fontFamily: "monospace" }}>{reportResult.reportId}</div>
                  </div>
                </div>
              </div>

              {/* Report Body */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
                {[
                  { label: "Total Projects Covered", value: reportResult.totalProjects },
                  { label: "Total Funds Analysed", value: reportResult.fundsAnalysed },
                  { label: "High-Risk Projects", value: reportResult.highRiskProjects },
                  { label: "Anomalies Detected", value: reportResult.anomaliesDetected },
                  { label: "Resolved Cases", value: reportResult.resolvedCases },
                  { label: "Pending Action", value: reportResult.pendingAction },
                ].map((k, i) => (
                  <div key={i} style={{ background: "#F7F8FA", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "10px 12px" }}>
                    <div style={{ fontSize: "10px", color: "#6B7480", textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#1B3A6B", fontFamily: "monospace" }}>{k.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", marginBottom: "10px" }}>Executive Summary</div>
              <div style={{ fontSize: "12px", color: "#3A4050", lineHeight: "1.8", marginBottom: "14px", padding: "12px", background: "#F7F8FA", borderRadius: "3px" }}>
                {reportResult.summary}
              </div>

              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", marginBottom: "10px" }}>Key Findings</div>
              {[
                { sno: 1, finding: "Unusual expenditure patterns detected across sanctioned works", severity: "Critical" },
                { sno: 2, finding: "Extreme cost deviation above baseline sanction amount flagged", severity: "High" },
                { sno: 3, finding: "Physical-financial progress mismatch in road and building infrastructure", severity: "High" },
                { sno: 4, finding: "Concentrated vendor assignment patterns flagged for audit review", severity: "High" },
                { sno: 5, finding: "Demographic clusters identified with duplicate demographic indicators", severity: "Medium" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", padding: "8px 0", borderBottom: "1px solid #F0F1F4", fontSize: "12px" }}>
                  <span style={{ color: "#9AA3B0", fontFamily: "monospace", width: "20px", flexShrink: 0 }}>{f.sno}.</span>
                  <span style={{ flex: 1, color: "#3A4050" }}>{f.finding}</span>
                  <span style={{ background: f.severity === "Critical" ? "#FEE2E2" : f.severity === "High" ? "#FFEDD5" : "#FEF3C7", color: f.severity === "Critical" ? "#DC2626" : f.severity === "High" ? "#EA580C" : "#D97706", padding: "1px 6px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{f.severity}</span>
                </div>
              ))}

              <div style={{ marginTop: "14px", padding: "10px 12px", background: "#EEF2F9", borderRadius: "3px", fontSize: "11px", color: "#6B7480", borderLeft: "3px solid #1B3A6B" }}>
                This report has been generated by VIGILANT-MPLAD AI Engine v1.2.0. AI-generated findings are advisory in nature and designed to guide human verification. Report ID: {reportResult.reportId} | Ministry of Statistics and Programme Implementation.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Previous Reports */}
      <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px", marginTop: "14px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Previously Generated Reports</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead><tr style={{ background: "#F0F1F4" }}>
            {["Report ID", "Type", "Generated By", "Date & Time", "Parameters", "Status", "Action"].map(h => (
              <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, fontSize: "11px", color: "#3A4050", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[
              { id: "RPT-2026-082", type: "District Risk Report", by: "Joint Secretary", date: "24 Aug 2026", params: "Rajasthan · FY 2025-26", status: "Final" },
              { id: "RPT-2026-079", type: "AI Risk Report", by: "R.K. Sharma", date: "22 Aug 2026", params: "All Districts · High Risk", status: "Final" },
              { id: "RPT-2026-071", type: "Financial Utilisation", by: "Finance Officer", date: "15 Aug 2026", params: "All States · FY 2025-26", status: "Final" },
              { id: "RPT-2026-065", type: "Fraud Investigation", by: "CAG Auditor", date: "10 Aug 2026", params: "Critical Alert Audit", status: "Under Review" },
            ].map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F0F1F4" }}>
                <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: "11px", color: "#1B3A6B", fontWeight: 600 }}>{r.id}</td>
                <td style={{ padding: "8px 10px" }}>{r.type}</td>
                <td style={{ padding: "8px 10px", color: "#6B7480" }}>{r.by}</td>
                <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: "11px", color: "#6B7480" }}>{r.date}</td>
                <td style={{ padding: "8px 10px", fontSize: "11px", color: "#6B7480" }}>{r.params}</td>
                <td style={{ padding: "8px 10px" }}>
                  <span style={{ background: r.status === "Final" ? "#DCFCE7" : "#FEF3C7", color: r.status === "Final" ? "#15803D" : "#D97706", padding: "2px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: 600 }}>{r.status}</span>
                </td>
                <td style={{ padding: "8px 10px" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={() => handleDownload("csv")} style={{ padding: "3px 7px", background: "#EEF2F9", color: "#1B3A6B", border: "1px solid #C8D8F0", borderRadius: "3px", fontSize: "10px", cursor: "pointer" }}>View</button>
                    <button onClick={() => handleDownload("csv")} style={{ padding: "3px 7px", background: "#fff", color: "#3A4050", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "10px", cursor: "pointer" }}>CSV</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

