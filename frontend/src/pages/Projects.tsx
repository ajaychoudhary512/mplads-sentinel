import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useDataset } from "../context/DatasetContext";

interface ProjectsProps {
  onNavigate: (page: any, data?: any) => void;
}

function RiskBadge({ level, score }: { level: string; score?: number }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    Critical: { bg: "#FEE2E2", color: "#DC2626" },
    High: { bg: "#FFEDD5", color: "#EA580C" },
    Medium: { bg: "#FEF3C7", color: "#D97706" },
    Low: { bg: "#DCFCE7", color: "#15803D" },
  };
  const c = cfg[level] || cfg.Low;
  return (
    <span style={{ background: c.bg, color: c.color, padding: "2px 7px", borderRadius: "3px", fontSize: "11px", fontWeight: 700, border: `1px solid ${c.color}22`, display: "inline-flex", alignItems: "center", gap: "4px" }}>
      {score !== undefined && <span style={{ fontFamily: "monospace" }}>{score}</span>}
      <span>{level.toUpperCase()}</span>
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    "Completed": { bg: "#DCFCE7", color: "#15803D" },
    "Under Implementation": { bg: "#EEF2F9", color: "#1B3A6B" },
    "Delayed": { bg: "#FEF3C7", color: "#D97706" },
    "Verification Required": { bg: "#FEE2E2", color: "#DC2626" },
  };
  const c = cfg[status] || { bg: "#F0F1F4", color: "#6B7480" };
  return (
    <span style={{ background: c.bg, color: c.color, padding: "2px 8px", borderRadius: "3px", fontSize: "11px", fontWeight: 600 }}>
      {status}
    </span>
  );
}

export function Projects({ onNavigate }: ProjectsProps) {
  const { activeVersion, activeMetadata } = useDataset();

  const [projects, setProjects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [availableStates, setAvailableStates] = useState<string[]>(["All States"]);
  const [availableCategories, setAvailableCategories] = useState<string[]>(["All Categories"]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("All States");
  const [filterRisk, setFilterRisk] = useState("All Risk Levels");
  const [filterStatus, setFilterStatus] = useState("All Statuses");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [sortCol, setSortCol] = useState("risk_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const res = await api.listProjects({
          dataset_version: activeVersion,
          search,
          state: filterState,
          risk_level: filterRisk,
          status: filterStatus,
          category: filterCategory,
          sort_by: sortCol,
          sort_dir: sortDir,
          page,
          page_size: PAGE_SIZE,
        });

        setProjects(res.items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
        if (res.available_states?.length) {
          setAvailableStates(["All States", ...res.available_states]);
        }
        if (res.available_categories?.length) {
          setAvailableCategories(["All Categories", ...res.available_categories]);
        }
      } catch (err) {
        console.error("Error loading projects:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadProjects();
    }, 150);

    return () => clearTimeout(timer);
  }, [activeVersion, search, filterState, filterRisk, filterStatus, filterCategory, sortCol, sortDir, page]);

  const toggleSort = (col: string) => {
    const colMap: Record<string, string> = {
      id: "work_id",
      name: "work_description",
      mp: "mp_name",
      district: "constituency",
      category: "work_category",
      approved: "effective_sanction_amount",
      utilized: "expenditure_amount",
      status: "dashboard_status",
      risk: "risk_score",
      lastUpdated: "sanction_date"
    };
    const dbCol = colMap[col] || col;
    if (sortCol === dbCol) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortCol(dbCol);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    const colMap: Record<string, string> = {
      id: "work_id",
      name: "work_description",
      mp: "mp_name",
      district: "constituency",
      category: "work_category",
      approved: "effective_sanction_amount",
      utilized: "expenditure_amount",
      status: "dashboard_status",
      risk: "risk_score",
      lastUpdated: "sanction_date"
    };
    const dbCol = colMap[col] || col;
    return (
      <span style={{ marginLeft: "4px", opacity: sortCol === dbCol ? 1 : 0.3, fontSize: "10px" }}>
        {sortCol === dbCol ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
      </span>
    );
  };

  const handleExport = () => {
    window.open("/api/reports/export?dataset_type=projects&format=csv", "_blank");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>MPLAD Projects</h1>
          <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>
            Financial Year 2025–26 | Total: {total.toLocaleString()} projects {loading && "(Loading...)"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleExport} style={{ padding: "7px 14px", background: "#fff", color: "#3A4050", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}>
            Export Excel
          </button>
          <button onClick={() => onNavigate("reports")} style={{ padding: "7px 14px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            Generate Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "12px 14px", marginBottom: "14px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#6B7480", marginBottom: "4px" }}>Search</div>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search projects, IDs, districts..."
            style={{ padding: "6px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", width: "220px", outline: "none" }}
          />
        </div>
        {[
          { label: "State", value: filterState, set: setFilterState, options: availableStates },
          { label: "Category", value: filterCategory, set: setFilterCategory, options: availableCategories },
          { label: "Risk Level", value: filterRisk, set: setFilterRisk, options: ["All Risk Levels", "Critical", "High", "Medium", "Low"] },
          { label: "Status", value: filterStatus, set: setFilterStatus, options: ["All Statuses", "Completed", "Under Implementation", "Delayed", "Verification Required"] },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#6B7480", marginBottom: "4px" }}>{f.label}</div>
            <select value={f.value} onChange={e => { f.set(e.target.value); setPage(1); }} style={{ padding: "6px 10px", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", background: "#fff", minWidth: "140px" }}>
              {f.options.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <button onClick={() => { setSearch(""); setFilterState("All States"); setFilterRisk("All Risk Levels"); setFilterStatus("All Statuses"); setFilterCategory("All Categories"); setPage(1); }}
          style={{ padding: "6px 12px", background: "#F0F1F4", color: "#3A4050", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", cursor: "pointer", alignSelf: "flex-end" }}>
          Reset
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="gov-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr>
                {[
                  { label: "Project ID", col: "id" },
                  { label: "Project Name", col: "name" },
                  { label: "MP / Constituency", col: "mp" },
                  { label: "District / State", col: "district" },
                  { label: "Category", col: "category" },
                  { label: "Approved (₹ Cr)", col: "approved" },
                  { label: "Utilised (₹ Cr)", col: "utilized" },
                  { label: "Completion %", col: "completion" },
                  { label: "Status", col: "status" },
                  { label: "AI Risk Score", col: "risk" },
                  { label: "Last Updated", col: "lastUpdated" },
                  { label: "Action", col: "" },
                ].map(h => (
                  <th key={h.label} onClick={() => h.col && toggleSort(h.col)} style={{ background: "#F0F1F4", padding: "9px 11px", textAlign: "left", fontWeight: 700, fontSize: "11px", color: "#3A4050", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "2px solid #D0D5DD", cursor: h.col ? "pointer" : "default", whiteSpace: "nowrap", userSelect: "none" }}>
                    {h.label}{h.col && <SortIcon col={h.col} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr key={i} style={{ cursor: "pointer" }} onClick={() => onNavigate("project-detail", p)}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#F7F8FA"}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ""}
                >
                  <td style={{ padding: "9px 11px", fontFamily: "monospace", fontSize: "11px", color: "#1B3A6B", fontWeight: 600 }}>{p.id}</td>
                  <td style={{ padding: "9px 11px", maxWidth: "180px" }}>
                    <div style={{ fontWeight: 500, fontSize: "12px", color: "#1A1D23" }}>{p.name}</div>
                  </td>
                  <td style={{ padding: "9px 11px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 500 }}>{p.mp}</div>
                    <div style={{ fontSize: "10px", color: "#9AA3B0" }}>{p.constituency}</div>
                  </td>
                  <td style={{ padding: "9px 11px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 500 }}>{p.district}</div>
                    <div style={{ fontSize: "10px", color: "#9AA3B0" }}>{p.state}</div>
                  </td>
                  <td style={{ padding: "9px 11px", fontSize: "11px" }}>{p.category}</td>
                  <td style={{ padding: "9px 11px", fontFamily: "monospace", fontSize: "12px", fontWeight: 600 }}>₹{p.approved}</td>
                  <td style={{ padding: "9px 11px", fontFamily: "monospace", fontSize: "12px" }}>₹{p.utilized}</td>
                  <td style={{ padding: "9px 11px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ flex: 1, height: "5px", background: "#E2E5EA", borderRadius: "3px", minWidth: "50px" }}>
                        <div style={{ height: "100%", width: `${p.completion}%`, background: p.completion >= 90 ? "#15803D" : p.completion >= 50 ? "#1B3A6B" : "#D97706", borderRadius: "3px" }} />
                      </div>
                      <span style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: 600 }}>{p.completion}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "9px 11px" }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: "9px 11px" }}><RiskBadge level={p.riskLevel} score={p.risk} /></td>
                  <td style={{ padding: "9px 11px", fontSize: "11px", color: "#6B7480" }}>{p.lastUpdated}</td>
                  <td style={{ padding: "9px 11px" }}>
                    <button onClick={e => { e.stopPropagation(); onNavigate("project-detail", p); }}
                      style={{ padding: "4px 10px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ padding: "40px", textAlign: "center", color: "#9AA3B0" }}>
                    {loading ? "Loading projects..." : "No projects found matching the selected filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderTop: "1px solid #E2E5EA", background: "#F7F8FA" }}>
          <div style={{ fontSize: "12px", color: "#6B7480" }}>
            Showing {total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()} projects
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button onClick={() => setPage(1)} disabled={page === 1} style={{ padding: "4px 8px", border: "1px solid #D0D5DD", borderRadius: "3px", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: "12px", opacity: page === 1 ? 0.5 : 1 }}>«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "4px 8px", border: "1px solid #D0D5DD", borderRadius: "3px", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: "12px", opacity: page === 1 ? 0.5 : 1 }}>‹</button>
            <span style={{ padding: "4px 10px", fontSize: "12px", fontWeight: 600, color: "#1B3A6B" }}>
              Page {page} of {totalPages || 1}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: "4px 8px", border: "1px solid #D0D5DD", borderRadius: "3px", background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: "12px", opacity: page >= totalPages ? 0.5 : 1 }}>›</button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} style={{ padding: "4px 8px", border: "1px solid #D0D5DD", borderRadius: "3px", background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: "12px", opacity: page >= totalPages ? 0.5 : 1 }}>»</button>
          </div>
        </div>
      </div>
    </div>
  );
}
