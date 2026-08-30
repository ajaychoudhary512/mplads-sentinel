import { useState } from "react";
import { NOTIFICATIONS } from "../data/mockData";

interface NotificationsProps {
  onNavigate: (page: any, data?: any) => void;
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  "Critical AI Alert": { bg: "#FEE2E2", color: "#DC2626" },
  "Financial Anomaly": { bg: "#FFEDD5", color: "#EA580C" },
  "Project Delay": { bg: "#FEF3C7", color: "#D97706" },
  "Inspection Required": { bg: "#FEF3C7", color: "#D97706" },
  "Report Generated": { bg: "#DCFCE7", color: "#15803D" },
  "System Notification": { bg: "#EEF2F9", color: "#1B3A6B" },
};

export function Notifications({ onNavigate }: NotificationsProps) {
  const [notifs, setNotifs] = useState(NOTIFICATIONS.map(n => ({ ...n })));
  const [filter, setFilter] = useState("All");

  const markRead = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));

  const unread = notifs.filter(n => !n.read).length;

  const filtered = notifs.filter(n => {
    if (filter === "Unread") return !n.read;
    if (filter === "Critical") return n.severity === "Critical";
    if (filter === "Info") return n.severity === "Info";
    return true;
  });

  return (
    <div>
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1B3A6B", margin: 0 }}>
            Notifications
            {unread > 0 && <span style={{ marginLeft: "10px", background: "#DC2626", color: "#fff", borderRadius: "12px", padding: "2px 8px", fontSize: "12px", fontWeight: 700 }}>{unread} unread</span>}
          </h1>
          <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "2px" }}>System alerts and AI-generated notifications</div>
        </div>
        <button onClick={markAllRead} style={{ padding: "6px 14px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "12px", cursor: "pointer", color: "#3A4050" }}>Mark All as Read</button>
      </div>

      {/* Filter tabs */}
      <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", marginBottom: "14px", display: "flex", overflow: "hidden" }}>
        {["All", "Unread", "Critical", "Info"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ flex: 1, padding: "9px 10px", background: "none", border: "none", borderBottom: filter === f ? "2px solid #1B3A6B" : "2px solid transparent", color: filter === f ? "#1B3A6B" : "#6B7480", fontWeight: filter === f ? 700 : 400, cursor: "pointer", fontSize: "12px", marginBottom: "-1px" }}>
            {f} {f === "Unread" && unread > 0 && <span style={{ background: "#DC2626", color: "#fff", borderRadius: "10px", padding: "1px 5px", fontSize: "10px", marginLeft: "4px" }}>{unread}</span>}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.map((n, i) => {
          const c = TYPE_COLORS[n.type] || { bg: "#F0F1F4", color: "#6B7480" };
          return (
            <div key={i} style={{ background: n.read ? "#fff" : "#FAFBFF", border: "1px solid #E2E5EA", borderLeft: `4px solid ${c.color}`, borderRadius: "3px", padding: "14px 16px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
              {!n.read && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1B3A6B", flexShrink: 0, marginTop: "5px" }} />}
              {n.read && <div style={{ width: "8px", height: "8px", flexShrink: 0 }} />}

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ background: c.bg, color: c.color, padding: "2px 7px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{n.type}</span>
                  <span style={{ fontSize: "11px", color: "#9AA3B0" }}>{n.time}</span>
                  {!n.read && <span style={{ fontSize: "10px", color: "#1B3A6B", fontWeight: 600 }}>NEW</span>}
                </div>
                <div style={{ fontSize: "13px", fontWeight: n.read ? 400 : 700, color: "#1A1D23", marginBottom: "4px" }}>{n.title}</div>
                <div style={{ fontSize: "12px", color: "#6B7480" }}>{n.message}</div>
              </div>

              <div style={{ display: "flex", gap: "6px", flexShrink: 0, alignSelf: "center" }}>
                {!n.read && (
                  <button onClick={() => markRead(n.id)} style={{ padding: "4px 10px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "3px", fontSize: "11px", cursor: "pointer", color: "#3A4050" }}>Mark Read</button>
                )}
                <button onClick={() => { markRead(n.id); if (n.severity === "Critical" || n.severity === "High") onNavigate("fraud-alerts"); else if (n.type === "Report Generated") onNavigate("reports"); }} style={{ padding: "4px 10px", background: "#EEF2F9", color: "#1B3A6B", border: "1px solid #C8D8F0", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}>View Alert</button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #E2E5EA", borderRadius: "3px", padding: "40px", textAlign: "center", color: "#9AA3B0" }}>No notifications in this category.</div>
        )}
      </div>
    </div>
  );
}
