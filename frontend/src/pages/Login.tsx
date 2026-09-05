import { useState } from "react";
import { authService } from "../services/auth";

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [userId, setUserId] = useState("rk.sharma@mospi.gov.in");
  const [password, setPassword] = useState("••••••••");
  const [role, setRole] = useState("monitoring-officer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password) { setError("Please enter User ID and Password."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      authService.setUser({
        userId,
        role,
        name: role === "monitoring-officer" ? "R.K. Sharma" : "Administrator",
        token: `AUTH_${btoa(userId + ":" + Date.now())}`,
        loginTime: new Date().toISOString()
      });
      setLoading(false);
      onLogin();
    }, 600);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#F7F8FA", fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
      {/* Top strip */}
      <div style={{ background: "#0F2244", color: "#fff", fontSize: "12px", padding: "5px 20px", textAlign: "center" }}>
        Government of India — Ministry of Statistics and Programme Implementation | <span style={{ color: "#86efac" }}>🔒 Secure Government Application</span>
      </div>

      {/* Header */}
      <header style={{ background: "#1B3A6B", borderBottom: "3px solid #F97316", padding: "12px 32px", display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🦁</div>
        <div style={{ color: "#fff" }}>
          <div style={{ fontSize: "11px", opacity: 0.8, letterSpacing: "0.06em" }}>GOVERNMENT OF INDIA</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>MP-Guard AI</div>
          <div style={{ fontSize: "11px", opacity: 0.75 }}>Ministry of Statistics and Programme Implementation</div>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ display: "flex", gap: "48px", maxWidth: "900px", width: "100%", alignItems: "flex-start" }}>
          {/* Left info panel */}
          <div style={{ flex: 1, paddingTop: "20px" }}>
            <div style={{ background: "#1B3A6B", color: "#fff", padding: "24px", borderRadius: "4px", marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#FCD34D", marginBottom: "6px" }}>PROBLEM STATEMENT ID: SIH26102</div>
              <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", lineHeight: 1.4 }}>AI-Powered MPLAD Monitoring & Risk Intelligence Platform</div>
              <div style={{ fontSize: "12px", opacity: 0.85, lineHeight: 1.6 }}>
                Detect anomalies, fraud and inefficiencies in MPLAD Scheme implementation to ensure transparency, accountability and optimal utilization of public funds.
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #E2E5EA", padding: "16px", borderRadius: "4px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#6B7480", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Key Capabilities</div>
              {[
                "AI-powered anomaly & fraud detection",
                "Real-time risk scoring & prioritization",
                "Geo-spatial project verification",
                "Financial pattern analysis",
                "Explainable AI with audit trail",
                "Role-based access control",
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "6px", fontSize: "12px", color: "#3A4050" }}>
                  <span style={{ color: "#15803D", fontWeight: 700, marginTop: "1px" }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Login form */}
          <div style={{ width: "380px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "4px", padding: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#1B3A6B" }}>Secure Login</div>
              <div style={{ fontSize: "12px", color: "#6B7480", marginTop: "4px" }}>MPLAD Monitoring & Risk Intelligence</div>
            </div>

            {error && (
              <div style={{ background: "#FEE2E2", border: "1px solid #DC2626", borderRadius: "3px", padding: "8px 12px", marginBottom: "16px", fontSize: "12px", color: "#DC2626" }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3A4050", marginBottom: "5px" }}>
                  User ID / Email <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  placeholder="Enter your User ID or Email"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #C8CDD6", borderRadius: "3px", fontSize: "13px", outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "#1B3A6B"}
                  onBlur={e => e.target.style.borderColor = "#C8CDD6"}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3A4050", marginBottom: "5px" }}>
                  Password <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #C8CDD6", borderRadius: "3px", fontSize: "13px", outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "#1B3A6B"}
                  onBlur={e => e.target.style.borderColor = "#C8CDD6"}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3A4050", marginBottom: "5px" }}>
                  Role <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #C8CDD6", borderRadius: "3px", fontSize: "13px", background: "#fff", outline: "none" }}
                >
                  <option value="administrator">Administrator</option>
                  <option value="mp">MP / Authorised Representative</option>
                  <option value="implementing-agency">Implementing Agency</option>
                  <option value="auditor">Auditor (CAG/State)</option>
                  <option value="monitoring-officer">Monitoring Officer (MoSPI)</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3A4050", marginBottom: "5px" }}>CAPTCHA Verification</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <div style={{ background: "#F0F1F4", border: "1px solid #D0D5DD", borderRadius: "3px", padding: "6px 14px", fontSize: "14px", fontFamily: "monospace", letterSpacing: "0.3em", color: "#3A4050", userSelect: "none", flexShrink: 0 }}>4 8 X 7 Q</div>
                  <input type="text" placeholder="Enter CAPTCHA" style={{ flex: 1, padding: "8px 10px", border: "1px solid #C8CDD6", borderRadius: "3px", fontSize: "13px", outline: "none" }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: "10px", background: loading ? "#9AA3B0" : "#1B3A6B", color: "#fff", border: "none", borderRadius: "3px", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginBottom: "12px", letterSpacing: "0.02em" }}
              >
                {loading ? "Verifying..." : "Login to MP-Guard AI"}
              </button>
            </form>

            <div style={{ textAlign: "center" }}>
              <button style={{ background: "none", border: "none", color: "#1B3A6B", cursor: "pointer", fontSize: "12px" }}>Forgot Password?</button>
            </div>

            <div style={{ marginTop: "20px", padding: "10px", background: "#EEF2F9", borderRadius: "3px", fontSize: "11px", color: "#6B7480", textAlign: "center" }}>
              🔒 This is a secure Government of India application. Unauthorized access is prohibited under the IT Act, 2000.
            </div>
          </div>
        </div>
      </div>

      <footer style={{ background: "#0F2244", color: "rgba(255,255,255,0.5)", fontSize: "11px", padding: "8px 20px", textAlign: "center" }}>
        © Government of India | Ministry of Statistics and Programme Implementation | Privacy Policy | Terms of Use | Contact: helpdesk-mplad@mospi.gov.in
      </footer>
    </div>
  );
}
