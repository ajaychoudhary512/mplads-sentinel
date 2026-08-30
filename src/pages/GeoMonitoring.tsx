import { useState } from "react";
import { PROJECTS } from "../data/mockData";

interface GeoMonitoringProps {
  onNavigate: (page: any, data?: any) => void;
}

const STATES_SVG = [
  { id: "rajasthan", label: "Rajasthan", cx: 210, cy: 220, projects: 342, risk: "High" },
  { id: "maharashtra", label: "Maharashtra", cx: 260, cy: 340, projects: 218, risk: "Medium" },
  { id: "uttar-pradesh", label: "Uttar Pradesh", cx: 350, cy: 190, projects: 298, risk: "Medium" },
  { id: "kerala", label: "Kerala", cx: 270, cy: 450, projects: 142, risk: "Low" },
  { id: "telangana", label: "Telangana", cx: 310, cy: 380, projects: 167, risk: "Low" },
  { id: "madhya-pradesh", label: "Madhya Pradesh", cx: 300, cy: 260, projects: 189, risk: "Medium" },
  { id: "gujarat", label: "Gujarat", cx: 175, cy: 295, projects: 156, risk: "Low" },
  { id: "punjab", label: "Punjab", cx: 260, cy: 120, projects: 98, risk: "High" },
];

const MARKERS = [
  { id: "MPLAD-2026-00482", label: "Alwar, RJ", cx: 218, cy: 205, risk: "Critical" },
  { id: "MPLAD-2026-00317", label: "Bikaner, RJ", cx: 175, cy: 195, risk: "High" },
  { id: "MPLAD-2026-00156", label: "Barmer, RJ", cx: 160, cy: 240, risk: "High" },
  { id: "MPLAD-2026-00284", label: "Nagpur, MH", cx: 295, cy: 335, risk: "Medium" },
  { id: "MPLAD-2026-00203", label: "Hyderabad, TG", cx: 305, cy: 380, risk: "Low" },
  { id: "MPLAD-2026-00391", label: "Ernakulam, KL", cx: 270, cy: 445, risk: "Low" },
  { id: "MPLAD-2026-00129", label: "Gorakhpur, UP", cx: 370, cy: 200, risk: "Low" },
  { id: "MPLAD-2026-00178", label: "Jaipur, RJ", cx: 225, cy: 220, risk: "Medium" },
];

const RISK_COLOR: Record<string, string> = {
  Critical: "#DC2626",
  High: "#EA580C",
  Medium: "#D97706",
  Low: "#15803D",
};

export function GeoMonitoring({ onNavigate }: GeoMonitoringProps) {
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState("All");

  const visibleMarkers = MARKERS.filter(m => filter === "All" || m.risk === filter);

  const selectedProject = selected ? PROJECTS.find(p => p.id === selected.id) : null;

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>Geo-Spatial Project Monitoring</h1>
        <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>Interactive map of MPLAD project locations with risk markers | FY 2025–26</div>
      </div>

      {/* Filter + Legend bar */}
      <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "10px 14px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#3A4050" }}>Filter by Risk:</span>
          {["All", "Critical", "High", "Medium", "Low"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "4px 10px", border: `1px solid ${filter === f ? RISK_COLOR[f] || "#1B3A6B" : "#D0D5DD"}`, borderRadius: "3px", background: filter === f ? (RISK_COLOR[f] || "#1B3A6B") : "#fff", color: filter === f ? "#fff" : "#3A4050", fontSize: "11px", fontWeight: filter === f ? 700 : 400, cursor: "pointer" }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {Object.entries(RISK_COLOR).map(([k, v]) => (
            <span key={k} style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: v, display: "inline-block" }} />
              {k}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "14px" }}>
        {/* Map SVG */}
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #E2E5EA", fontSize: "13px", fontWeight: 700, color: "#1A1D23", display: "flex", justifyContent: "space-between" }}>
            <span>India — MPLAD Project Distribution Map</span>
            <span style={{ fontSize: "11px", color: "#9AA3B0", fontWeight: 400 }}>Click a marker to view project details</span>
          </div>
          <svg viewBox="0 80 530 430" style={{ width: "100%", height: "520px", display: "block", background: "#F0F4FA" }}>
            {/* Simplified India outline */}
            <path d="M180,95 L230,88 L290,90 L340,95 L400,110 L440,130 L460,150 L470,180 L475,210 L465,240 L450,260 L430,280 L410,310 L390,340 L370,370 L355,400 L340,420 L330,440 L315,460 L300,475 L285,485 L270,490 L255,488 L240,480 L225,468 L215,455 L210,440 L200,425 L195,405 L190,385 L185,365 L182,345 L178,325 L174,305 L170,285 L165,265 L160,245 L158,225 L158,205 L160,185 L165,160 L170,140 L175,118 Z" fill="#D4E4F0" stroke="#B8CDD8" strokeWidth="1.5" />

            {/* State region highlights */}
            {STATES_SVG.map(s => (
              <circle key={s.id} cx={s.cx} cy={s.cy} r={s.projects / 10} fill={s.risk === "High" ? "#EA580C" : s.risk === "Medium" ? "#D97706" : "#86AFDF"} opacity={0.12} />
            ))}

            {/* District boundary lines (simplified) */}
            <line x1="200" y1="150" x2="250" y2="150" stroke="#C8D8E8" strokeWidth="0.8" strokeDasharray="3,3" />
            <line x1="250" y1="150" x2="250" y2="300" stroke="#C8D8E8" strokeWidth="0.8" strokeDasharray="3,3" />
            <line x1="200" y1="300" x2="320" y2="300" stroke="#C8D8E8" strokeWidth="0.8" strokeDasharray="3,3" />
            <line x1="250" y1="200" x2="400" y2="200" stroke="#C8D8E8" strokeWidth="0.8" strokeDasharray="3,3" />
            <line x1="300" y1="150" x2="300" y2="400" stroke="#C8D8E8" strokeWidth="0.8" strokeDasharray="3,3" />

            {/* State labels */}
            {STATES_SVG.map(s => (
              <text key={s.id} x={s.cx} y={s.cy} textAnchor="middle" fontSize="9" fill="#7A95AB" fontFamily="sans-serif" fontWeight="500">{s.label}</text>
            ))}

            {/* Project markers */}
            {visibleMarkers.map(m => (
              <g key={m.id} style={{ cursor: "pointer" }} onClick={() => setSelected(m)}>
                <circle cx={m.cx} cy={m.cy} r={selected?.id === m.id ? 10 : 7} fill={RISK_COLOR[m.risk]} opacity={0.9} stroke="#fff" strokeWidth={selected?.id === m.id ? 2.5 : 1.5} />
                {selected?.id === m.id && (
                  <circle cx={m.cx} cy={m.cy} r={14} fill="none" stroke={RISK_COLOR[m.risk]} strokeWidth="1.5" opacity={0.5} />
                )}
                <title>{m.id} — {m.label} — Risk: {m.risk}</title>
              </g>
            ))}

            {/* Compass */}
            <g transform="translate(470,105)">
              <circle cx="0" cy="0" r="14" fill="white" stroke="#C8D8E8" strokeWidth="1" />
              <text x="0" y="-6" textAnchor="middle" fontSize="8" fill="#3A4050" fontWeight="700">N</text>
              <line x1="0" y1="-2" x2="0" y2="-10" stroke="#1B3A6B" strokeWidth="1.5" />
            </g>
          </svg>
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Selected project panel */}
          <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "14px", minHeight: "200px" }}>
            {selected ? (
              <>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#1B3A6B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>Selected Project</div>
                <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#1B3A6B", fontWeight: 700, marginBottom: "4px" }}>{selected.id}</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A1D23", marginBottom: "8px" }}>{selectedProject?.name || "—"}</div>
                {[
                  { label: "Location", value: selected.label },
                  { label: "Status", value: selectedProject?.status || "—" },
                  { label: "Progress", value: `${selectedProject?.completion || 0}%` },
                  { label: "Approved Amount", value: `₹${selectedProject?.approved || "—"} Cr` },
                  { label: "Utilisation", value: `₹${selectedProject?.utilized || "—"} Cr` },
                  { label: "AI Risk Score", value: `${selectedProject?.risk || "—"}/100` },
                  { label: "Last Updated", value: selectedProject?.lastUpdated || "—" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "5px 0", borderBottom: "1px solid #F7F8FA" }}>
                    <span style={{ color: "#9AA3B0" }}>{r.label}</span>
                    <span style={{ fontWeight: 500, color: "#1A1D23" }}>{r.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                  <button onClick={() => onNavigate("project-detail", selectedProject)} style={{ flex: 1, padding: "6px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>View Details</button>
                  <button onClick={() => setSelected(null)} style={{ padding: "6px 10px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>×</button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "160px", color: "#9AA3B0", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>📍</div>
                <div style={{ fontSize: "12px" }}>Click a map marker to view project details</div>
              </div>
            )}
          </div>

          {/* Satellite Verification */}
          <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "14px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#3A4050", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Geo-Verification Status</div>
            {selected ? (
              <>
                {[
                  { label: "Reported Location", value: "26.4499°N, 76.5921°E" },
                  { label: "Inspection Coordinates", value: "26.4524°N, 76.5679°E" },
                  { label: "Coordinate Variance", value: selected.id === "MPLAD-2026-00482" ? "2.7 km" : selected.id === "MPLAD-2026-00203" ? "1.8 km" : "< 0.5 km" },
                  { label: "Last Inspection Date", value: "15 Aug 2025" },
                  { label: "Satellite Imagery", value: "Available (Apr 2026)" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "5px 0", borderBottom: "1px solid #F7F8FA" }}>
                    <span style={{ color: "#9AA3B0" }}>{r.label}</span>
                    <span style={{ fontWeight: 500, color: r.label === "Coordinate Variance" && parseFloat(r.value) > 1 ? "#DC2626" : "#1A1D23" }}>{r.value}</span>
                  </div>
                ))}
                {["MPLAD-2026-00482", "MPLAD-2026-00203"].includes(selected.id) && (
                  <div style={{ marginTop: "8px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "3px", padding: "7px 10px", fontSize: "11px", color: "#D97706" }}>
                    ⚠ Location mismatch detected: {selected.id === "MPLAD-2026-00482" ? "2.7 km" : "1.8 km"}. Field verification recommended.
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: "#9AA3B0", fontSize: "12px", textAlign: "center", padding: "20px 0" }}>Select a project to view geo-verification data</div>
            )}
          </div>

          {/* State Summary */}
          <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "14px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#3A4050", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>State-wise Risk Summary</div>
            {STATES_SVG.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #F7F8FA", fontSize: "11px" }}>
                <span style={{ color: "#3A4050", fontWeight: 500 }}>{s.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#9AA3B0" }}>{s.projects} projects</span>
                  <span style={{ background: s.risk === "High" ? "#FFEDD5" : s.risk === "Medium" ? "#FEF3C7" : "#DCFCE7", color: s.risk === "High" ? "#EA580C" : s.risk === "Medium" ? "#D97706" : "#15803D", padding: "1px 5px", borderRadius: "3px", fontSize: "10px", fontWeight: 700 }}>{s.risk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
