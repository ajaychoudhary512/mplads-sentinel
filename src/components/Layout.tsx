import { useState } from "react";

type Page = "dashboard" | "projects" | "project-detail" | "ai-risk" | "fraud-alerts" | "geo-monitoring" | "financial" | "vendors" | "reports" | "audit-trail" | "notifications" | "settings";

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page, data?: any) => void;
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

export function Layout({ currentPage, onNavigate, children, breadcrumb }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langHindi, setLangHindi] = useState(false);

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
      {/* Top strip */}
      <div style={{ background: "#0F2244", color: "#fff", fontSize: "12px", padding: "4px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Government of India — Ministry of Statistics and Programme Implementation</span>
        <span>Last Updated: 27 August 2026 | Data refreshed at: 13:30 IST | <span style={{ color: "#86efac" }}>● System Status: Operational</span></span>
      </div>

      {/* Main header */}
      <header style={{ background: "#1B3A6B", color: "#fff", borderBottom: "3px solid #F97316", padding: "0 16px", display: "flex", alignItems: "center", height: "64px", flexShrink: 0 }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
          {/* Emblem placeholder */}
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="48" fill="#F97316" stroke="#1B3A6B" strokeWidth="2"/>
              <circle cx="50" cy="50" r="38" fill="#fff" stroke="#1B3A6B" strokeWidth="1.5"/>
              <text x="50" y="56" textAnchor="middle" fontSize="22" fill="#1B3A6B" fontWeight="bold">🦁</text>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "11px", opacity: 0.85, letterSpacing: "0.05em" }}>GOVERNMENT OF INDIA</div>
            <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.02em", lineHeight: 1.2 }}>MP-Guard AI</div>
            <div style={{ fontSize: "10px", opacity: 0.75 }}>MPLAD Monitoring & Risk Intelligence</div>
          </div>
          <div style={{ width: "1px", background: "rgba(255,255,255,0.25)", height: "36px", margin: "0 8px" }} />
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "18px", padding: "4px 6px", borderRadius: "4px", opacity: 0.8 }} title="Toggle Sidebar">☰</button>
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "11px", padding: "4px 8px", borderRadius: "3px", opacity: 0.85, display: "flex", alignItems: "center", gap: "4px" }} title="Accessibility">
            <span>♿</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.12)", borderRadius: "3px", overflow: "hidden", fontSize: "11px" }}>
            <button onClick={() => setLangHindi(false)} style={{ background: !langHindi ? "rgba(255,255,255,0.25)" : "none", border: "none", color: "#fff", cursor: "pointer", padding: "4px 8px", fontWeight: !langHindi ? 700 : 400 }}>English</button>
            <button onClick={() => setLangHindi(true)} style={{ background: langHindi ? "rgba(255,255,255,0.25)" : "none", border: "none", color: "#fff", cursor: "pointer", padding: "4px 8px", fontFamily: "'Noto Sans Devanagari', sans-serif", fontWeight: langHindi ? 700 : 400 }}>हिंदी</button>
          </div>
          <button style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "11px", padding: "4px 8px", opacity: 0.85 }}>Help</button>
          <div style={{ position: "relative" }}>
            <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "6px 8px", fontSize: "16px", position: "relative" }}>
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
            <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "4px", color: "#fff", cursor: "pointer", padding: "6px 10px" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>RK</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "11px", fontWeight: 600 }}>R.K. Sharma</div>
                <div style={{ fontSize: "10px", opacity: 0.75 }}>Monitoring Officer</div>
              </div>
              <span style={{ fontSize: "10px", opacity: 0.7 }}>▼</span>
            </button>
            {profileOpen && (
              <div style={{ position: "absolute", right: 0, top: "100%", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "4px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", width: "200px", zIndex: 1000, color: "#1A1D23" }}>
                {["My Profile", "Change Password", "Preferences", "─────────", "Sign Out"].map((item, i) => (
                  <button key={i} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", background: "none", border: "none", cursor: item === "─────────" ? "default" : "pointer", fontSize: "13px", color: item === "Sign Out" ? "#DC2626" : item === "─────────" ? "#D0D5DD" : "#1A1D23", borderBottom: i === 3 ? "1px solid #F0F1F4" : "none" }}>
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
              <div>MP-Guard AI v2.4.1</div>
              <div>© Government of India</div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: "auto", background: "#F7F8FA", display: "flex", flexDirection: "column" }}>
          {/* Breadcrumb */}
          <div style={{ background: "#fff", borderBottom: "1px solid #E2E5EA", padding: "8px 20px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6B7480", flexShrink: 0 }}>
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
          <div style={{ flex: 1, padding: "20px", overflow: "auto" }}>
            {children}
          </div>
        </main>
      </div>

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
