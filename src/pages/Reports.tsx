import { useState } from "react";

export function Reports() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [reportType, setReportType] = useState("AI Risk Report");
  const [form, setForm] = useState({ district: "All Districts", constituency: "All", dateFrom: "2026-04-01", dateTo: "2026-08-27", riskCategory: "All", financialYear: "2025-26" });

  const handleGenerate = () => {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2000);
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
        <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>Generate and export analytical reports for MPLAD scheme monitoring</div>
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
            { label: "District", key: "district", options: ["All Districts", "Alwar", "Bikaner", "Barmer", "Jaipur", "Nagpur", "Ernakulam"], type: "select" },
            { label: "Constituency", key: "constituency", options: ["All", "Alwar", "Bikaner", "Ernakulam", "Hyderabad", "Gorakhpur"], type: "select" },
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
              <button style={{ padding: "7px", background: "#15803D", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>⬇ Download PDF</button>
              <button style={{ padding: "7px", background: "#fff", color: "#1B3A6B", border: "1px solid #1B3A6B", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}>⬇ Export Excel</button>
              <button style={{ padding: "7px", background: "#fff", color: "#3A4050", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}>📤 Share with Auditor</button>
            </div>
          )}
        </div>

        {/* Report Preview */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          {generating && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", color: "#6B7480" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px", animation: "pulse 1.5s ease-in-out infinite" }}>📊</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#1B3A6B", marginBottom: "6px" }}>Generating Report...</div>
              <div style={{ fontSize: "12px" }}>Compiling data from MPLAD records and AI analysis</div>
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

          {generated && !generating && (
            <div>
              {/* Report Header */}
              <div style={{ borderBottom: "2px solid #1B3A6B", paddingBottom: "14px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "#6B7480", letterSpacing: "0.06em", textTransform: "uppercase" }}>Government of India | Ministry of Statistics and Programme Implementation</div>
                    <div style={{ fontSize: "17px", fontWeight: 700, color: "#1B3A6B", marginTop: "4px" }}>{reportType}</div>
                    <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>MPLAD Scheme | Financial Year {form.financialYear} | Generated: 27 August 2026</div>
                  </div>
                  <div style={{ background: "#F0F1F4", padding: "8px 12px", borderRadius: "3px", textAlign: "right", fontSize: "11px" }}>
                    <div style={{ fontWeight: 700, color: "#1B3A6B" }}>Report ID</div>
                    <div style={{ fontFamily: "monospace" }}>RPT-2026-{Math.floor(Math.random() * 1000).toString().padStart(3, "0")}</div>
                  </div>
                </div>
              </div>

              {/* Report Body */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
                {[
                  { label: "Total Projects Covered", value: "1,284" },
                  { label: "Total Funds Analysed", value: "₹482.6 Cr" },
                  { label: "High-Risk Projects", value: "43" },
                  { label: "Anomalies Detected", value: "65" },
                  { label: "Resolved Cases", value: "214" },
                  { label: "Pending Action", value: "58" },
                ].map((k, i) => (
                  <div key={i} style={{ background: "#F7F8FA", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "10px 12px" }}>
                    <div style={{ fontSize: "10px", color: "#6B7480", textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#1B3A6B", fontFamily: "monospace" }}>{k.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", marginBottom: "10px" }}>Executive Summary</div>
              <div style={{ fontSize: "12px", color: "#3A4050", lineHeight: "1.8", marginBottom: "14px", padding: "12px", background: "#F7F8FA", borderRadius: "3px" }}>
                The AI-based monitoring system analysed 1,284 MPLAD projects for Financial Year {form.financialYear}. A total of ₹482.6 Crore was allocated, of which ₹391.4 Crore (81.1%) has been utilised. AI algorithms detected 65 anomalous patterns across {form.district === "All Districts" ? "all districts" : form.district}, including duplicate billing indicators, cost overruns, and geographic inconsistencies. 43 projects have been classified as high-risk or critical and require immediate administrative attention.
              </div>

              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", marginBottom: "10px" }}>Key Findings</div>
              {[
                { sno: 1, finding: "Possible duplicate billing detected in MPLAD-2026-00482 (AI Confidence: 96%)", severity: "Critical" },
                { sno: 2, finding: "Cost overrun without administrative revision in MPLAD-2026-00156 (+24%)", severity: "High" },
                { sno: 3, finding: "Expenditure-progress mismatch in 9 road infrastructure projects", severity: "High" },
                { sno: 4, finding: "Vendor M/s Sharma Constructions: anomalies across 4 projects", severity: "High" },
                { sno: 5, finding: "127 duplicate beneficiary records identified across 6 districts", severity: "Medium" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", padding: "8px 0", borderBottom: "1px solid #F0F1F4", fontSize: "12px" }}>
                  <span style={{ color: "#9AA3B0", fontFamily: "monospace", width: "20px", flexShrink: 0 }}>{f.sno}.</span>
                  <span style={{ flex: 1, color: "#3A4050" }}>{f.finding}</span>
                  <span style={{ background: f.severity === "Critical" ? "#FEE2E2" : f.severity === "High" ? "#FFEDD5" : "#FEF3C7", color: f.severity === "Critical" ? "#DC2626" : f.severity === "High" ? "#EA580C" : "#D97706", padding: "1px 6px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{f.severity}</span>
                </div>
              ))}

              <div style={{ marginTop: "14px", padding: "10px 12px", background: "#EEF2F9", borderRadius: "3px", fontSize: "11px", color: "#6B7480", borderLeft: "3px solid #1B3A6B" }}>
                This report has been generated by MP-Guard AI v2.4.1. AI-generated findings are advisory in nature and require human verification before administrative action. Report ID: RPT-2026-082 | Generated by: R.K. Sharma (Monitoring Officer) | Date: 27 August 2026
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
              { id: "RPT-2026-082", type: "District Risk Report", by: "Joint Secretary", date: "24 Aug 2026", params: "Alwar · FY 2025-26", status: "Final" },
              { id: "RPT-2026-079", type: "AI Risk Report", by: "R.K. Sharma", date: "22 Aug 2026", params: "All Districts · High Risk", status: "Final" },
              { id: "RPT-2026-071", type: "Financial Utilisation", by: "Finance Officer", date: "15 Aug 2026", params: "All States · FY 2025-26", status: "Final" },
              { id: "RPT-2026-065", type: "Fraud Investigation", by: "CAG Auditor", date: "10 Aug 2026", params: "MPLAD-2026-00482", status: "Under Review" },
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
                    <button style={{ padding: "3px 7px", background: "#EEF2F9", color: "#1B3A6B", border: "1px solid #C8D8F0", borderRadius: "3px", fontSize: "10px", cursor: "pointer" }}>View</button>
                    <button style={{ padding: "3px 7px", background: "#fff", color: "#3A4050", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "10px", cursor: "pointer" }}>PDF</button>
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
