import { useState } from "react";
import { VENDORS } from "../data/mockData";

export function Vendors() {
  const [activeTab, setActiveTab] = useState("vendors");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>Vendor & Beneficiary Intelligence</h1>
        <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>AI-assisted analysis of vendor patterns and beneficiary records</div>
      </div>

      <div style={{ display: "flex", borderBottom: "2px solid #E2E5EA", marginBottom: "14px", background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px 3px 0 0" }}>
        {["vendors", "beneficiaries"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "10px 20px", background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #1B3A6B" : "2px solid transparent", color: activeTab === tab ? "#1B3A6B" : "#6B7480", fontWeight: activeTab === tab ? 700 : 400, cursor: "pointer", fontSize: "13px", marginBottom: "-1px", textTransform: "capitalize" }}>
            {tab === "vendors" ? "Vendors" : "Beneficiaries"}
          </button>
        ))}
      </div>

      {activeTab === "vendors" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedVendor ? "1fr 340px" : "1fr", gap: "12px" }}>
          <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #E2E5EA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>Registered Vendors — MPLAD Scheme</div>
              <div style={{ display: "flex", gap: "6px" }}>
                <input placeholder="Search vendors..." style={{ padding: "5px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", width: "180px" }} />
                <button style={{ padding: "5px 10px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>Export</button>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#F0F1F4" }}>
                  {["Vendor Name", "Registration ID", "Projects", "Total Payments (₹ Cr)", "Avg Cost (₹ L)", "AI Risk Score", "Anomalies", "Status", "Action"].map(h => (
                    <th key={h} style={{ padding: "9px 11px", textAlign: "left", fontWeight: 700, fontSize: "10px", color: "#3A4050", textTransform: "uppercase", borderBottom: "2px solid #D0D5DD", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VENDORS.map((v, i) => (
                  <tr key={i} onClick={() => setSelectedVendor(v)} style={{ borderBottom: "1px solid #F0F1F4", cursor: "pointer", background: selectedVendor?.id === v.id ? "#EEF2F9" : "" }}
                    onMouseEnter={e => { if (selectedVendor?.id !== v.id) (e.currentTarget as HTMLElement).style.background = "#F7F8FA"; }}
                    onMouseLeave={e => { if (selectedVendor?.id !== v.id) (e.currentTarget as HTMLElement).style.background = ""; }}>
                    <td style={{ padding: "9px 11px" }}>
                      <div style={{ fontWeight: 600, fontSize: "12px" }}>{v.name}</div>
                      <div style={{ fontSize: "10px", color: "#9AA3B0" }}>{v.state}</div>
                    </td>
                    <td style={{ padding: "9px 11px", fontFamily: "monospace", fontSize: "10px", color: "#6B7480" }}>{v.regId}</td>
                    <td style={{ padding: "9px 11px", fontFamily: "monospace", fontWeight: 600, textAlign: "center" }}>{v.projects}</td>
                    <td style={{ padding: "9px 11px", fontFamily: "monospace", fontWeight: 600 }}>₹{v.totalPayments}</td>
                    <td style={{ padding: "9px 11px", fontFamily: "monospace" }}>₹{v.avgCost}</td>
                    <td style={{ padding: "9px 11px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <div style={{ width: "40px", height: "5px", background: "#E2E5EA", borderRadius: "3px" }}>
                          <div style={{ height: "100%", width: `${v.risk}%`, background: v.risk >= 70 ? "#DC2626" : v.risk >= 50 ? "#D97706" : "#15803D", borderRadius: "3px" }} />
                        </div>
                        <span style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: 700, color: v.risk >= 70 ? "#DC2626" : v.risk >= 50 ? "#D97706" : "#15803D" }}>{v.risk}</span>
                      </div>
                    </td>
                    <td style={{ padding: "9px 11px", textAlign: "center" }}>
                      <span style={{ background: v.anomalies > 2 ? "#FEE2E2" : v.anomalies > 0 ? "#FEF3C7" : "#DCFCE7", color: v.anomalies > 2 ? "#DC2626" : v.anomalies > 0 ? "#D97706" : "#15803D", padding: "2px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: 700, fontFamily: "monospace" }}>{v.anomalies}</span>
                    </td>
                    <td style={{ padding: "9px 11px" }}>
                      <span style={{ background: v.status === "Active" ? "#DCFCE7" : v.status === "Flagged" ? "#FEE2E2" : "#FEF3C7", color: v.status === "Active" ? "#15803D" : v.status === "Flagged" ? "#DC2626" : "#D97706", padding: "2px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: 600 }}>{v.status}</span>
                    </td>
                    <td style={{ padding: "9px 11px" }}>
                      <button onClick={e => { e.stopPropagation(); setSelectedVendor(v); }} style={{ padding: "3px 8px", background: "#EEF2F9", color: "#1B3A6B", border: "1px solid #C8D8F0", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>Analyse</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedVendor && (
            <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#1B3A6B" }}>Vendor Intelligence</div>
                <button onClick={() => setSelectedVendor(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#9AA3B0" }}>×</button>
              </div>
              <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "2px" }}>{selectedVendor.name}</div>
              <div style={{ fontSize: "10px", fontFamily: "monospace", color: "#6B7480", marginBottom: "12px" }}>{selectedVendor.regId}</div>

              {[
                { label: "State of Registration", value: selectedVendor.state },
                { label: "Total Projects", value: selectedVendor.projects },
                { label: "Total Payments", value: `₹${selectedVendor.totalPayments} Cr` },
                { label: "Average Project Cost", value: `₹${selectedVendor.avgCost} L` },
                { label: "Anomalies Detected", value: selectedVendor.anomalies },
                { label: "AI Risk Score", value: `${selectedVendor.risk}/100` },
                { label: "Current Status", value: selectedVendor.status },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F7F8FA", fontSize: "12px" }}>
                  <span style={{ color: "#6B7480" }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: "#1A1D23" }}>{r.value}</span>
                </div>
              ))}

              {/* Network Analysis placeholder */}
              <div style={{ marginTop: "14px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#3A4050", marginBottom: "8px" }}>Vendor Network Analysis</div>
                <div style={{ background: "#F7F8FA", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "12px", fontSize: "11px" }}>
                  <div style={{ textAlign: "center", marginBottom: "8px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: selectedVendor.risk >= 70 ? "#FEE2E2" : "#EEF2F9", border: `1px solid ${selectedVendor.risk >= 70 ? "#DC2626" : "#C8D8F0"}`, borderRadius: "4px", padding: "4px 10px" }}>
                      <span style={{ fontSize: "12px" }}>🏢</span>
                      <span style={{ fontWeight: 700, color: selectedVendor.risk >= 70 ? "#DC2626" : "#1B3A6B", fontSize: "11px" }}>{selectedVendor.name.replace("M/s ", "")}</span>
                    </div>
                  </div>
                  {/* Simple relationship indicators */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {[`${selectedVendor.projects} MPLAD Projects linked`, `3 Implementing Agencies`, `₹${selectedVendor.totalPayments} Cr total payments`, selectedVendor.anomalies > 0 ? `${selectedVendor.anomalies} anomalies flagged` : "No anomalies detected"].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: i === 3 && selectedVendor.anomalies > 0 ? "#DC2626" : "#3A4050" }}>
                        <span style={{ color: "#9AA3B0" }}>→</span>{item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {selectedVendor.status !== "Active" && (
                <div style={{ marginTop: "10px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "3px", padding: "8px 10px", fontSize: "11px", color: "#D97706" }}>
                  ⚠ This vendor is currently <strong>{selectedVendor.status}</strong>. Exercise caution with new contract awards.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "beneficiaries" && (
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Beneficiary Intelligence — Anomaly Detection</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
            {[
              { label: "Total Beneficiaries", value: "38,420", color: "#1B3A6B" },
              { label: "Duplicate Records", value: "127", color: "#D97706" },
              { label: "Suspicious Clusters", value: "14", color: "#EA580C" },
              { label: "Geo Inconsistencies", value: "23", color: "#DC2626" },
            ].map((k, i) => (
              <div key={i} style={{ background: "#F7F8FA", border: "1px solid #E2E5EA", borderLeft: `3px solid ${k.color}`, borderRadius: "3px", padding: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#6B7480", textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: k.color, fontFamily: "monospace", marginTop: "4px" }}>{k.value}</div>
              </div>
            ))}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#F0F1F4" }}>
                {["Beneficiary ID", "Name", "District", "Project", "Anomaly Type", "Confidence", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, fontSize: "10px", color: "#3A4050", textTransform: "uppercase", borderBottom: "2px solid #D0D5DD" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { id: "BNF-00482-12", name: "Ramesh Sharma", district: "Alwar", project: "MPLAD-2026-00391", anomaly: "Duplicate Record", confidence: 92, status: "Pending Review" },
                { id: "BNF-00391-08", name: "Priya Nair", district: "Ernakulam", project: "MPLAD-2026-00391", anomaly: "Duplicate Record", confidence: 88, status: "Resolved" },
                { id: "BNF-00317-45", name: "Vijay Kumar", district: "Bikaner", project: "MPLAD-2026-00317", anomaly: "Unusual Concentration", confidence: 74, status: "Under Review" },
                { id: "BNF-00284-23", name: "Anita Devi", district: "Nagpur", project: "MPLAD-2026-00284", anomaly: "Geographic Inconsistency", confidence: 68, status: "Under Review" },
                { id: "BNF-00203-07", name: "Suresh Rao", district: "Hyderabad", project: "MPLAD-2026-00203", anomaly: "Geographic Inconsistency", confidence: 65, status: "Resolved" },
              ].map((b, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F0F1F4" }}>
                  <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: "11px", color: "#1B3A6B" }}>{b.id}</td>
                  <td style={{ padding: "8px 10px", fontWeight: 500 }}>{b.name}</td>
                  <td style={{ padding: "8px 10px", color: "#6B7480" }}>{b.district}</td>
                  <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: "11px", color: "#1B3A6B" }}>{b.project}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ background: "#FEF3C7", color: "#D97706", padding: "2px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: 600 }}>{b.anomaly}</span>
                  </td>
                  <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: "11px", fontWeight: 600, color: b.confidence >= 85 ? "#DC2626" : "#D97706" }}>{b.confidence}%</td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ background: b.status === "Resolved" ? "#DCFCE7" : b.status === "Under Review" ? "#EEF2F9" : "#FEF3C7", color: b.status === "Resolved" ? "#15803D" : b.status === "Under Review" ? "#1B3A6B" : "#D97706", padding: "2px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: 600 }}>{b.status}</span>
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <button style={{ padding: "3px 8px", background: "#EEF2F9", color: "#1B3A6B", border: "1px solid #C8D8F0", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
