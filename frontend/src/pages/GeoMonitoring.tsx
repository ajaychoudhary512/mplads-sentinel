import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../services/api";
import { useDataset } from "../context/DatasetContext";
import { getCoordinates } from "../components/geoCoordinates";

interface GeoMonitoringProps {
  onNavigate: (page: any, data?: any) => void;
}

type RiskLevel = "Critical" | "High" | "Medium" | "Low";
type ProjectMarker = {
  id: string; name: string; state: string; district: string; risk: RiskLevel;
  risk_score: number; approved: number; utilized: number; status: string; completion: number;
};

const RISK_COLOR: Record<RiskLevel, string> = { Critical: "#DC2626", High: "#EA580C", Medium: "#D97706", Low: "#15803D" };
const INDIA_CENTER: [number, number] = [22.5937, 78.9629];
const RISK_FILTERS: Array<"All" | RiskLevel> = ["All", "Critical", "High", "Medium", "Low"];

function formatAmount(value: number) {
  return `₹${Number(value || 0).toFixed(2)} Cr`;
}

export function GeoMonitoring({ onNavigate }: GeoMonitoringProps) {
  const { activeVersion, activeMetadata } = useDataset();
  const [states, setStates] = useState<any[]>([]);
  const [markers, setMarkers] = useState<ProjectMarker[]>([]);
  const [selected, setSelected] = useState<ProjectMarker | null>(null);
  const [filter, setFilter] = useState<"All" | RiskLevel>("All");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadGeo() {
      setLoading(true);
      setLoadError(false);
      try {
        const response = await api.getGeoProjects(activeVersion);
        if (cancelled) return;
        setStates(Array.isArray(response.states) ? response.states : []);
        setMarkers(Array.isArray(response.markers) ? response.markers : []);
      } catch (error) {
        console.error("Failed to load geo projects:", error);
        if (!cancelled) {
          setStates([]);
          setMarkers([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadGeo();
    return () => { cancelled = true; };
  }, [activeVersion]);

  const visibleMarkers = useMemo(() => markers.filter(marker => filter === "All" || marker.risk === filter), [filter, markers]);
  const stateSummary = useMemo(() => [...states].sort((a, b) => Number(b.projects || 0) - Number(a.projects || 0)).slice(0, 8), [states]);

  useEffect(() => {
    if (selected && !visibleMarkers.some(marker => marker.id === selected.id)) setSelected(null);
  }, [selected, visibleMarkers]);

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>Geo-Spatial Project Monitoring</h1>
        <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>Interactive OpenStreetMap view of MPLAD project locations · Dataset: <strong>{activeMetadata?.dataset_name || activeVersion}</strong></div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "4px", padding: "10px 14px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#3A4050" }}>Risk markers:</span>
          {RISK_FILTERS.map(level => {
            const active = filter === level;
            const color = level === "All" ? "#1B3A6B" : RISK_COLOR[level];
            return <button key={level} onClick={() => setFilter(level)} style={{ padding: "4px 10px", border: `1px solid ${active ? color : "#D0D5DD"}`, borderRadius: "3px", background: active ? color : "#fff", color: active ? "#fff" : "#3A4050", fontSize: "11px", fontWeight: active ? 700 : 500, cursor: "pointer" }}>{level}</button>;
          })}
        </div>
        <div style={{ fontSize: "11px", color: "#6B7480" }}>{loading ? "Loading project locations…" : `${visibleMarkers.length} real project markers shown`}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: "14px" }}>
        <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "4px", overflow: "hidden", minHeight: "540px" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #E2E5EA", fontSize: "13px", fontWeight: 700, color: "#1A1D23" }}>India — project distribution</div>
          <MapContainer center={INDIA_CENTER} zoom={5} minZoom={4} maxZoom={12} scrollWheelZoom style={{ height: "500px", width: "100%", background: "#E8F1F8" }} aria-label="Interactive map of MPLAD projects in India">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {visibleMarkers.map(marker => {
              const [lat, lng] = getCoordinates(marker.state, marker.district);
              const isSelected = selected?.id === marker.id;
              const color = RISK_COLOR[marker.risk];
              return <CircleMarker key={marker.id} center={[lat, lng]} radius={isSelected ? 10 : 7} pathOptions={{ color: "#fff", fillColor: color, fillOpacity: 0.9, weight: isSelected ? 3 : 1.5 }} eventHandlers={{ click: () => setSelected(marker) }}>
                <Tooltip direction="top" offset={[0, -6]}>{marker.id} · {marker.risk} ({Math.round(marker.risk_score)})</Tooltip>
                <Popup><strong>{marker.name}</strong><br />{marker.district}, {marker.state}<br />Risk: {marker.risk} ({Math.round(marker.risk_score)}/100)</Popup>
              </CircleMarker>;
            })}
          </MapContainer>
          {!loading && visibleMarkers.length === 0 && <div style={{ padding: "12px 14px", color: "#6B7480", fontSize: "12px", background: "#F8FAFC" }}>{loadError ? "Map data could not be loaded. Please check the API connection." : `No ${filter === "All" ? "project" : filter.toLowerCase()} markers are recorded for this dataset.`}</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "4px", padding: "14px", minHeight: "214px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#1B3A6B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "10px" }}>Selected project</div>
            {selected ? <>
              <div style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: "#1B3A6B" }}>{selected.id}</div>
              <div style={{ fontSize: "13px", fontWeight: 600, margin: "5px 0 10px" }}>{selected.name}</div>
              {[["Location", `${selected.district}, ${selected.state}`], ["Risk", `${selected.risk} · ${Math.round(selected.risk_score)}/100`], ["Approved", formatAmount(selected.approved)], ["Utilised", formatAmount(selected.utilized)], ["Status", selected.status || "Under Implementation"]].map(([label, value]) => <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid #F1F5F9", fontSize: "11px" }}><span style={{ color: "#6B7480" }}>{label}</span><span style={{ fontWeight: 600, textAlign: "right" }}>{value}</span></div>)}
              <button onClick={() => onNavigate("project-detail", selected)} style={{ width: "100%", marginTop: "12px", padding: "7px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>View project details</button>
            </> : <div style={{ color: "#6B7480", fontSize: "12px", lineHeight: 1.5, paddingTop: "35px", textAlign: "center" }}>Select a coloured marker to inspect its real project and risk details.</div>}
          </div>

          <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "4px", padding: "14px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#3A4050", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>State coverage</div>
            {stateSummary.length > 0 ? stateSummary.map(state => <div key={state.id || state.label} style={{ display: "flex", justifyContent: "space-between", gap: "8px", padding: "6px 0", borderBottom: "1px solid #F1F5F9", fontSize: "11px" }}><span style={{ fontWeight: 600 }}>{state.label}</span><span style={{ color: RISK_COLOR[state.risk as RiskLevel] || "#1B3A6B" }}>{Number(state.projects || 0).toLocaleString()} · {state.risk}</span></div>) : <div style={{ color: "#6B7480", fontSize: "12px", padding: "10px 0" }}>{loading ? "Loading state summary…" : "No state summary is available for this dataset."}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
