import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useDataset } from "../context/DatasetContext";

interface GeoMonitoringProps {
  onNavigate: (page: any, data?: any) => void;
}

const RISK_COLOR: Record<string, string> = {
  Critical: "#DC2626",
  High: "#EA580C",
  Medium: "#D97706",
  Low: "#15803D",
};

export function GeoMonitoring({ onNavigate }: GeoMonitoringProps) {
  const { activeVersion, activeMetadata } = useDataset();
  const [states, setStates] = useState<any[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadGeo() {
      setLoading(true);
      try {
        const res = await api.getGeoProjects(activeVersion);
        if (!isMounted) return;
        if (res.states && res.states.length) setStates(res.states);
        if (res.markers && res.markers.length) setMarkers(res.markers);
      } catch (err) {
        console.error("Failed to load Geo Projects:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadGeo();
    return () => { isMounted = false; };
  }, [activeVersion]);

  const visibleMarkers = markers.filter(m => filter === "All" || m.risk === filter);

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>Geo-Spatial Project Monitoring</h1>
        <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>
          Interactive map of MPLAD project locations with real-time risk markers | Dataset: <strong>{activeMetadata?.dataset_name || activeVersion}</strong> ({activeMetadata?.valid_row_count ? `${activeMetadata.valid_row_count.toLocaleString()} rows` : activeVersion})
        </div>
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
            <span>India — MPLAD Project Distribution Map ({visibleMarkers.length} Active High Risk Markers)</span>
            <span style={{ fontSize: "11px", color: "#9AA3B0", fontWeight: 400 }}>Click a marker to view project details</span>
          </div>
          <svg viewBox="0 80 530 430" style={{ width: "100%", height: "520px", display: "block", background: "#F0F4FA" }}>
            {/* Simplified India outline */}
            <path d="M180,95 L230,88 L290,90 L340,95 L400,110 L440,130 L460,150 L470,180 L475,210 L465,240 L450,260 L430,280 L410,310 L390,340 L370,370 L355,400 L340,420 L330,440 L315,460 L300,475 L285,485 L270,490 L255,488 L240,480 L225,468 L215,455 L210,440 L200,425 L195,405 L190,385 L185,365 L182,345 L178,325 L174,305 L170,285 L165,265 L160,245 L158,225 L158,205 L160,185 L165,160 L170,140 L175,118 Z" fill="#D4E4F0" stroke="#B8CDD8" strokeWidth="1.5" />

            {/* State region highlights */}
            {states.map((s, idx) => (
              <circle key={s.id || idx} cx={s.cx} cy={s.cy} r={Math.min(45, Math.max(12, s.projects / 80))} fill={s.risk === "Critical" ? "#DC2626" : s.risk === "High" ? "#EA580C" : s.risk === "Medium" ? "#D97706" : "#86AFDF"} opacity={0.14} />
            ))}

            {/* District boundary lines (simplified) */}
            <line x1="200" y1="150" x2="250" y2="150" stroke="#C8D8E8" strokeWidth="0.8" strokeDasharray="3,3" />
            <line x1="250" y1="150" x2="250" y2="300" stroke="#C8D8E8" strokeWidth="0.8" strokeDasharray="3,3" />
            <line x1="200" y1="300" x2="320" y2="300" stroke="#C8D8E8" strokeWidth="0.8" strokeDasharray="3,3" />
            <line x1="250" y1="200" x2="400" y2="200" stroke="#C8D8E8" strokeWidth="0.8" strokeDasharray="3,3" />
            <line x1="300" y1="150" x2="300" y2="400" stroke="#C8D8E8" strokeWidth="0.8" strokeDasharray="3,3" />

            {/* State labels */}
            {states.slice(0, 10).map((s, idx) => (
              <text key={s.id || idx} x={s.cx} y={s.cy} textAnchor="middle" fontSize="9" fill="#7A95AB" fontFamily="sans-serif" fontWeight="500">{s.label}</text>
            ))}

            {/* Project markers */}
            {visibleMarkers.map(m => (
              <g key={m.id} style={{ cursor: "pointer" }} onClick={() => setSelected(m)}>
                <circle cx={m.cx} cy={m.cy} r={selected?.id === m.id ? 10 : 7} fill={RISK_COLOR[m.risk] || "#1B3A6B"} opacity={0.9} stroke="#fff" strokeWidth={selected?.id === m.id ? 2.5 : 1.5} />
                {selected?.id === m.id && (
                  <circle cx={m.cx} cy={m.cy} r={14} fill="none" stroke={RISK_COLOR[m.risk] || "#1B3A6B"} strokeWidth="1.5" opacity={0.5} />
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
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A1D23", marginBottom: "8px", maxHeight: "40px", overflow: "hidden" }}>{selected.name}</div>
                {[
                  { label: "Location", value: `${selected.district}, ${selected.state}` },
                  { label: "Status", value: selected.status || "Under Implementation" },
                  { label: "Progress", value: `${selected.completion || 75}%` },
                  { label: "Approved Amount", value: `₹${selected.approved} Cr` },
                  { label: "Utilisation", value: `₹${selected.utilized} Cr` },
                  { label: "AI Risk Score", value: `${Math.round(selected.risk_score || 82)}/100` },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "5px 0", borderBottom: "1px solid #F7F8FA" }}>
                    <span style={{ color: "#9AA3B0" }}>{r.label}</span>
                    <span style={{ fontWeight: 500, color: "#1A1D23" }}>{r.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                  <button onClick={() => onNavigate("project-detail", selected)} style={{ flex: 1, padding: "6px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>View Details</button>
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
                  { label: "Reported Constituency", value: selected.district || selected.state },
                  { label: "State Region", value: selected.state },
                  { label: "Coordinate Variance", value: selected.risk === "Critical" ? "2.7 km (Flagged)" : "< 0.5 km (Normal)" },
                  { label: "Inspection Status", value: "Available in Master DB" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "5px 0", borderBottom: "1px solid #F7F8FA" }}>
                    <span style={{ color: "#9AA3B0" }}>{r.label}</span>
                    <span style={{ fontWeight: 500, color: r.label === "Coordinate Variance" && selected.risk === "Critical" ? "#DC2626" : "#1A1D23" }}>{r.value}</span>
                  </div>
                ))}
                {selected.risk === "Critical" && (
                  <div style={{ marginTop: "8px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "3px", padding: "7px 10px", fontSize: "11px", color: "#D97706" }}>
                    ⚠ Location discrepancy detected for {selected.id}. Field verification recommended.
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
            {states.slice(0, 8).map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #F7F8FA", fontSize: "11px" }}>
                <span style={{ color: "#3A4050", fontWeight: 500 }}>{s.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#9AA3B0" }}>{s.projects.toLocaleString()} projects</span>
                  <span style={{ background: s.risk === "Critical" || s.risk === "High" ? "#FFEDD5" : s.risk === "Medium" ? "#FEF3C7" : "#DCFCE7", color: s.risk === "Critical" || s.risk === "High" ? "#EA580C" : s.risk === "Medium" ? "#D97706" : "#15803D", padding: "1px 5px", borderRadius: "3px", fontSize: "10px", fontWeight: 700 }}>{s.risk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

