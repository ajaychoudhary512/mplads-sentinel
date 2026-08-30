import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TRANSACTIONS, MONTHLY_DATA } from "../data/mockData";

const VENDOR_PAYMENTS = [
  { vendor: "M/s Sharma Constructions", amount: 284.5 },
  { vendor: "M/s BuildRight Infra", amount: 192.3 },
  { vendor: "M/s SolarPower India", amount: 221.5 },
  { vendor: "M/s Aqua Systems", amount: 187.6 },
  { vendor: "M/s Desert Constructions", amount: 143.2 },
  { vendor: "Others", amount: 362.5 },
];

const DISTRICT_EXP = [
  { district: "Alwar", expenditure: 98.4, budget: 110.2 },
  { district: "Bikaner", expenditure: 62.1, budget: 88.5 },
  { district: "Nagpur", expenditure: 54.8, budget: 60.2 },
  { district: "Jaipur", expenditure: 78.2, budget: 80.0 },
  { district: "Ernakulam", expenditure: 42.1, budget: 45.0 },
  { district: "Hyderabad", expenditure: 55.7, budget: 58.3 },
];

const OVERRUN_DATA = [
  { category: "Health", projects: 8, overrunPct: 18 },
  { category: "Infrastructure", projects: 14, overrunPct: 24 },
  { category: "Education", projects: 3, overrunPct: 5 },
  { category: "Water", projects: 6, overrunPct: 12 },
  { category: "Agriculture", projects: 2, overrunPct: 4 },
];

const PIE_COLORS = ["#1B3A6B", "#2A5298", "#86AFDF", "#EA580C", "#D97706", "#9AA3B0"];

export function FinancialAnalytics() {
  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>Financial Monitoring & Analytics</h1>
        <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>Fund utilisation, expenditure patterns and transaction analysis | FY 2025–26</div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "16px" }}>
        {[
          { label: "Total Allocation", value: "₹482.6 Cr", sub: "FY 2025–26", color: "#1B3A6B" },
          { label: "Total Utilisation", value: "₹391.4 Cr", sub: "81.1% of allocation", color: "#15803D" },
          { label: "Average Project Cost", value: "₹37.6 L", sub: "Across 1,284 projects", color: "#1B3A6B" },
          { label: "Cost Overrun (Total)", value: "₹29.4 Cr", sub: "Across 33 projects", color: "#EA580C" },
          { label: "Suspicious Transactions", value: "15", sub: "Requiring verification", color: "#DC2626" },
        ].map((k, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #E2E5EA", borderTop: `3px solid ${k.color}`, borderRadius: "3px", padding: "14px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#6B7480", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{k.label}</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: k.color, fontFamily: "monospace" }}>{k.value}</div>
            <div style={{ fontSize: "10px", color: "#9AA3B0", marginTop: "2px" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "3px" }}>Monthly Expenditure Trend</div>
          <div style={{ fontSize: "11px", color: "#9AA3B0", marginBottom: "12px" }}>Allocation vs Utilisation by Month | Source: MPLAD Financial Records</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MONTHLY_DATA} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F4" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit=" Cr" />
              <Tooltip formatter={(v) => [`₹${v} Cr`, ""]} contentStyle={{ fontSize: "12px", borderRadius: "3px" }} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="allocated" name="Allocated" stroke="#1B3A6B" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="utilized" name="Utilised" stroke="#15803D" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "3px" }}>Vendor Payment Distribution</div>
          <div style={{ fontSize: "11px", color: "#9AA3B0", marginBottom: "10px" }}>Top vendors by total MPLAD payments</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={VENDOR_PAYMENTS} cx="50%" cy="50%" outerRadius={70} dataKey="amount" nameKey="vendor">
                {VENDOR_PAYMENTS.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`₹${v} Cr`, ""]} contentStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {VENDOR_PAYMENTS.slice(0, 4).map((v, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: PIE_COLORS[i], display: "inline-block" }} />
                  {v.vendor.replace("M/s ", "").slice(0, 20)}
                </span>
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>₹{v.amount}Cr</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "3px" }}>District-wise Expenditure Comparison</div>
          <div style={{ fontSize: "11px", color: "#9AA3B0", marginBottom: "12px" }}>Budget vs Actual | Top 6 Districts</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DISTRICT_EXP} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F4" />
              <XAxis dataKey="district" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit=" Cr" />
              <Tooltip formatter={(v) => [`₹${v} Cr`, ""]} contentStyle={{ fontSize: "12px", borderRadius: "3px" }} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="budget" name="Budget" fill="#86AFDF" radius={[2,2,0,0]} />
              <Bar dataKey="expenditure" name="Expenditure" fill="#1B3A6B" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "3px" }}>Cost Overrun Analysis by Category</div>
          <div style={{ fontSize: "11px", color: "#9AA3B0", marginBottom: "12px" }}>Projects with cost overrun and average overrun %</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={OVERRUN_DATA} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F4" />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: "Projects", angle: -90, position: "insideLeft", fontSize: 9, dy: 30 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" />
              <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "3px" }} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar yAxisId="left" dataKey="projects" name="No. of Projects" fill="#EA580C" radius={[2,2,0,0]} />
              <Bar yAxisId="right" dataKey="overrunPct" name="Avg Overrun %" fill="#FCD34D" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Anomaly Table */}
      <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #E2E5EA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700 }}>Transaction Anomaly Report</div>
            <div style={{ fontSize: "11px", color: "#9AA3B0" }}>AI-flagged transactions with significant deviation from expected range</div>
          </div>
          <button style={{ padding: "5px 12px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>Export Excel</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#F0F1F4" }}>
              {["Transaction ID", "Project ID", "Vendor", "Amount (₹L)", "Date", "Expected Range (₹L)", "Deviation", "AI Flag", "Action"].map(h => (
                <th key={h} style={{ padding: "9px 11px", textAlign: "left", fontWeight: 700, fontSize: "10px", color: "#3A4050", textTransform: "uppercase", borderBottom: "2px solid #D0D5DD", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRANSACTIONS.map((t, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F0F1F4" }}>
                <td style={{ padding: "9px 11px", fontFamily: "monospace", fontSize: "11px", color: "#1B3A6B" }}>{t.id}</td>
                <td style={{ padding: "9px 11px", fontFamily: "monospace", fontSize: "11px", color: "#1B3A6B", fontWeight: 600 }}>{t.projectId}</td>
                <td style={{ padding: "9px 11px", fontSize: "11px" }}>{t.vendor}</td>
                <td style={{ padding: "9px 11px", fontFamily: "monospace", fontWeight: 600 }}>{t.amount}</td>
                <td style={{ padding: "9px 11px", fontSize: "11px", color: "#6B7480" }}>{t.date}</td>
                <td style={{ padding: "9px 11px", fontFamily: "monospace", fontSize: "11px" }}>{t.expectedRange}</td>
                <td style={{ padding: "9px 11px" }}>
                  <span style={{ color: t.flag === "HIGH" ? "#DC2626" : t.flag === "MEDIUM" ? "#D97706" : "#15803D", fontFamily: "monospace", fontWeight: 700 }}>{t.deviation}</span>
                </td>
                <td style={{ padding: "9px 11px" }}>
                  <span style={{
                    background: t.flag === "HIGH" ? "#FEE2E2" : t.flag === "MEDIUM" ? "#FEF3C7" : "#DCFCE7",
                    color: t.flag === "HIGH" ? "#DC2626" : t.flag === "MEDIUM" ? "#D97706" : "#15803D",
                    padding: "2px 7px", borderRadius: "3px", fontSize: "10px", fontWeight: 700
                  }}>{t.flag}</span>
                </td>
                <td style={{ padding: "9px 11px" }}>
                  <button style={{ padding: "3px 8px", background: "#EEF2F9", color: "#1B3A6B", border: "1px solid #C8D8F0", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
