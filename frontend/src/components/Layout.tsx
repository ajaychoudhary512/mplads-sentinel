import { useState } from "react";
import { useDataset } from "../context/DatasetContext";
import { UploadDatasetModal } from "./UploadDatasetModal";

type Page = "dashboard" | "projects" | "project-detail" | "ai-risk" | "fraud-alerts" | "geo-monitoring" | "financial" | "vendors" | "reports" | "audit-trail" | "notifications" | "settings";

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page, data?: any) => void;
  onLogout?: () => void;
  children: React.ReactNode;
  breadcrumb: { label: string; page?: Page }[];
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "projects", label: "Projects", icon: "📋" },
  { id: "ai-risk", label: "AI Risk Monitoring", icon: "🔍" },
  { id: "fraud-alerts", label: "Alerts & Investigations", icon: "⚠" },
  { id: "financial", label: "Financial Monitoring", icon: "₹" },
  { id: "geo-monitoring", label: "Geo-Spatial Monitoring", icon: "🗺" },
  { id: "vendors", label: "Vendors & Beneficiaries", icon: "🏢" },
  { id: "reports", label: "Reports", icon: "📊" },
  { id: "audit-trail", label: "Audit Trail", icon: "📜" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "settings", label: "Administration", icon: "⚙" },
];

export function Layout({ currentPage, onNavigate, onLogout, children, breadcrumb }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langHindi, setLangHindi] = useState(false);
  const [datasetDropdownOpen, setDatasetDropdownOpen] = useState(false);

  const {
    activeVersion,
    activeMetadata,
    availableVersions,
    switchDatasetVersion,
    isUploadModalOpen,
    openUploadModal,
    closeUploadModal,
    loading: datasetLoading
  } = useDataset();

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
      {/* Top strip */}
      <div style={{ background: "#0F2244", color: "#fff", fontSize: "12px", padding: "4px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Government of India — Ministry of Statistics and Programme Implementation (MoSPI)</span>
        <span>
          Active Dataset: <strong style={{ color: "#FDBA74" }}>{activeMetadata?.dataset_name || `Dataset ${activeVersion}`} ({activeVersion})</strong> | 
          <span style={{ color: "#86efac", marginLeft: "8px" }}>● System Status: Operational</span>
        </span>
      </div>

      {/* Main header */}
      <header style={{ background: "#1B3A6B", color: "#fff", borderBottom: "3px solid #F97316", padding: "0 16px", display: "flex", alignItems: "center", height: "64px", flexShrink: 0 }}>
        {/* Left branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="48" fill="#F97316" stroke="#1B3A6B" strokeWidth="2"/>
              <circle cx="50" cy="50" r="38" fill="#fff" stroke="#1B3A6B" strokeWidth="1.5"/>
              <text x="50" y="56" textAnchor="middle" fontSize="22" fill="#1B3A6B" fontWeight="bold">🦁</text>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "11px", opacity: 0.85, letterSpacing: "0.05em" }}>GOVERNMENT OF INDIA</div>
            <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.02em", lineHeight: 1.2 }}>VIGILANT-MPLAD</div>
            <div style={{ fontSize: "10px", opacity: 0.75 }}>MPLAD Monitoring & Risk Intelligence Platform</div>
          </div>
          <div style={{ width: "1px", background: "rgba(255,255,255,0.25)", height: "36px", margin: "0 8px" }} />
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "18px", padding: "4px 6px", borderRadius: "4px", opacity: 0.8 }} title="Toggle Sidebar">☰</button>
        </div>

        {/* Center: Dataset Version Switcher & Upload Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginRight: "16px" }}>
          {/* Dataset Selector Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setDatasetDropdownOpen(!datasetDropdownOpen); setProfileOpen(false); setNotifOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "4px",
                padding: "6px 12px",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Switch Active Dataset Version"
            >
              <span style={{ fontSize: "13px" }}>📦</span>
              <span>Dataset: <span style={{ color: "#FED7AA" }}>{activeVersion}</span></span>
              <span style={{ fontSize: "10px", opacity: 0.8 }}>({activeMetadata?.row_count ? `${activeMetadata.row_count.toLocaleString()} works` : "Active"})</span>
              <span style={{ fontSize: "10px" }}>▼</span>
            </button>

            {datasetDropdownOpen && (
              <div style={{ position: "absolute", left: 0, top: "100%", marginTop: "4px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "6px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", width: "320px", zIndex: 1000, color: "#1A1D23" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #E2E8F0", fontSize: "12px", fontWeight: 700, color: "#1B3A6B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Select Active Dataset Version</span>
                  <span style={{ fontSize: "10px", background: "#EFF6FF", color: "#1D4ED8", padding: "1px 6px", borderRadius: "3px" }}>{availableVersions.length} Available</span>
                </div>
                <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                  {availableVersions.map((v) => {
                    const isSelected = v.version_id === activeVersion;
                    return (
                      <div
                        key={v.version_id}
                        onClick={() => {
                          switchDatasetVersion(v.version_id);
                          setDatasetDropdownOpen(false);
                        }}
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid #F1F5F9",
                          cursor: "pointer",
                          background: isSelected ? "#EFF6FF" : "#fff",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "background 0.15s",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: isSelected ? "#1B3A6B" : "#1E293B", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>{v.dataset_name || `Dataset ${v.version_id}`}</span>
                            <span style={{ background: isSelected ? "#15803D" : "#64748B", color: "#fff", padding: "1px 5px", borderRadius: "3px", fontSize: "9px" }}>{v.version_id}</span>
                          </div>
                          <div style={{ fontSize: "10px", color: "#64748B", marginTop: "2px" }}>
                            {v.row_count?.toLocaleString()} works • {v.uploaded_at}
                          </div>
                        </div>
                        {isSelected && <span style={{ color: "#15803D", fontWeight: 700, fontSize: "13px" }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding: "10px 14px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", textAlign: "center" }}>
                  <button
                    onClick={() => {
                      setDatasetDropdownOpen(false);
                      openUploadModal();
                    }}
                    style={{
                      width: "100%",
                      padding: "6px 12px",
                      background: "#1B3A6B",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <span>+</span> Upload New Dataset Version
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={openUploadModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#F97316",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(249,115,22,0.4)",
            }}
          >
            <span>📁</span>
            <span>Upload Dataset</span>
          </button>
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.12)", borderRadius: "3px", overflow: "hidden", fontSize: "11px" }}>
            <button onClick={() => setLangHindi(false)} style={{ background: !langHindi ? "rgba(255,255,255,0.25)" : "none", border: "none", color: "#fff", cursor: "pointer", padding: "4px 8px", fontWeight: !langHindi ? 700 : 400 }}>English</button>
            <button onClick={() => setLangHindi(true)} style={{ background: langHindi ? "rgba(255,255,255,0.25)" : "none", border: "none", color: "#fff", cursor: "pointer", padding: "4px 8px", fontFamily: "'Noto Sans Devanagari', sans-serif", fontWeight: langHindi ? 700 : 400 }}>हिंदी</button>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); setDatasetDropdownOpen(false); }} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "6px 8px", fontSize: "16px", position: "relative" }}>
              🔔
              <span style={{ position: "absolute", top: "2px", right: "4px", background: "#DC2626", borderRadius: "50%", width: "14px", height: "14px", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>3</span>
            </button>
            {notifOpen && (
              <div style={{ position: "absolute", right: 0, top: "100%", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "4px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", width: "320px", zIndex: 1000, color: "#1A1D23" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #E2E5EA", fontWeight: 600, fontSize: "13px" }}>Notifications (3 unread)</div>
                {[
                  { t: "Critical AI Alert", m: "MPLAD-2026-00482 flagged with Risk Score 82/100", time: "1h ago", c: "#DC2626" },
                  { t: "Financial Anomaly", m: "Transaction TXN-2026-004821: +53% deviation", time: "3h ago", c: "#EA580C" },
                  { t: "Project Delay", m: "MPLAD-2026-00156 – deadline missed", time: "5h ago", c: "#D97706" },
                ].map((n, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderBottom: "1px solid #F0F1F4", cursor: "pointer" }} onClick={() => { setNotifOpen(false); onNavigate("notifications"); }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: n.c, textTransform: "uppercase", letterSpacing: "0.05em" }}>{n.t}</div>
                    <div style={{ fontSize: "12px", marginTop: "2px" }}>{n.m}</div>
                    <div style={{ fontSize: "11px", color: "#9AA3B0", marginTop: "2px" }}>{n.time}</div>
                  </div>
                ))}
                <div style={{ padding: "8px 14px", textAlign: "center" }}>
                  <button onClick={() => { setNotifOpen(false); onNavigate("notifications"); }} style={{ background: "none", border: "none", color: "#1B3A6B", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>View All Notifications →</button>
                </div>
              </div>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); setDatasetDropdownOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "4px", color: "#fff", cursor: "pointer", padding: "6px 10px" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>RK</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "11px", fontWeight: 600 }}>R.K. Sharma</div>
                <div style={{ fontSize: "10px", opacity: 0.75 }}>Monitoring Officer</div>
              </div>
              <span style={{ fontSize: "10px", opacity: 0.7 }}>▼</span>
            </button>
            {profileOpen && (
              <div style={{ position: "absolute", right: 0, top: "100%", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "4px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", width: "200px", zIndex: 1000, color: "#1A1D23" }}>
                {["My Profile", "Dataset Management", "Preferences", "─────────", "Sign Out"].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setProfileOpen(false);
                      if (item === "Dataset Management") openUploadModal();
                      if (item === "Sign Out" && onLogout) onLogout();
                    }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", background: "none", border: "none", cursor: item === "─────────" ? "default" : "pointer", fontSize: "13px", color: item === "Sign Out" ? "#DC2626" : item === "─────────" ? "#D0D5DD" : "#1A1D23", borderBottom: i === 3 ? "1px solid #F0F1F4" : "none" }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <aside style={{ width: sidebarCollapsed ? "52px" : "220px", background: "#1A2B45", color: "#fff", flexShrink: 0, overflow: "hidden", transition: "width 0.2s", display: "flex", flexDirection: "column" }}>
          <nav style={{ flex: 1, paddingTop: "8px", overflowY: "auto" }}>
            {NAV_ITEMS.map(item => {
              const active = currentPage === item.id || (currentPage === "project-detail" && item.id === "projects");
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as Page)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 14px", background: active ? "#1B3A6B" : "none", border: "none", borderLeft: active ? "3px solid #F97316" : "3px solid transparent", cursor: "pointer", color: active ? "#fff" : "rgba(255,255,255,0.7)", fontSize: "13px", textAlign: "left", transition: "all 0.15s"
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                  title={item.label}
                >
                  <span style={{ fontSize: "14px", width: "20px", textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                  {!sidebarCollapsed && <span style={{ whiteSpace: "nowrap", fontWeight: active ? 600 : 400 }}>{item.label}</span>}
                  {!sidebarCollapsed && item.id === "notifications" && (
                    <span style={{ marginLeft: "auto", background: "#DC2626", color: "#fff", borderRadius: "10px", padding: "1px 6px", fontSize: "10px", fontWeight: 700 }}>3</span>
                  )}
                  {!sidebarCollapsed && item.id === "fraud-alerts" && (
                    <span style={{ marginLeft: "auto", background: "#EA580C", color: "#fff", borderRadius: "10px", padding: "1px 6px", fontSize: "10px", fontWeight: 700 }}>8</span>
                  )}
                </button>
              );
            })}
          </nav>
          {!sidebarCollapsed && (
            <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
              <div>VIGILANT-MPLAD v2.4.1</div>
              <div>Active Dataset: {activeVersion}</div>
              <div>© Government of India</div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: "auto", background: "#F7F8FA", display: "flex", flexDirection: "column" }}>
          {/* Breadcrumb & Quick Info */}
          <div style={{ background: "#fff", borderBottom: "1px solid #E2E5EA", padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#6B7480", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {breadcrumb.map((crumb, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {i > 0 && <span style={{ color: "#C8CDD6" }}>/</span>}
                  {crumb.page ? (
                    <button onClick={() => onNavigate(crumb.page!)} style={{ background: "none", border: "none", cursor: "pointer", color: "#1B3A6B", fontSize: "12px", fontWeight: 500, padding: 0 }}>{crumb.label}</button>
                  ) : (
                    <span style={{ color: i === breadcrumb.length - 1 ? "#1A1D23" : "#6B7480", fontWeight: i === breadcrumb.length - 1 ? 500 : 400 }}>{crumb.label}</span>
                  )}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px" }}>
              <span>Active Scope: <strong style={{ color: "#1B3A6B" }}>{activeMetadata?.dataset_name || `Dataset ${activeVersion}`}</strong> ({activeMetadata?.row_count?.toLocaleString() || "28,706"} Works)</span>
            </div>
          </div>
          <div style={{ flex: 1, padding: "20px", overflow: "auto" }}>
            {children}
          </div>
        </main>
      </div>

      {/* Global Upload Dataset Modal */}
      <UploadDatasetModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        onCompleteNavigate={(page) => onNavigate(page as Page)}
      />

      {/* Footer */}
      <footer style={{ background: "#0F2244", color: "rgba(255,255,255,0.6)", fontSize: "11px", padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderTop: "2px solid #1B3A6B" }}>
        <span>Content owned and maintained by Ministry of Statistics and Programme Implementation, Government of India</span>
        <div style={{ display: "flex", gap: "12px" }}>
          {["Accessibility", "Privacy Policy", "Terms of Use", "Contact Us"].map(l => (
            <button key={l} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "11px" }}>{l}</button>
          ))}
        </div>
      </footer>
    </div>
  );
}
