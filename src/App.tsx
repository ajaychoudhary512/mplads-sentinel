import { useState } from "react";
import { Login } from "./pages/Login";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { ProjectDetail } from "./pages/ProjectDetail";
import { AIRisk } from "./pages/AIRisk";
import { FraudAlerts } from "./pages/FraudAlerts";
import { GeoMonitoring } from "./pages/GeoMonitoring";
import { FinancialAnalytics } from "./pages/FinancialAnalytics";
import { Vendors } from "./pages/Vendors";
import { Reports } from "./pages/Reports";
import { AuditTrail } from "./pages/AuditTrail";
import { Notifications } from "./pages/Notifications";
import { Settings } from "./pages/Settings";
import { DatasetProvider } from "./context/DatasetContext";

type Page =
  | "dashboard"
  | "projects"
  | "project-detail"
  | "ai-risk"
  | "fraud-alerts"
  | "geo-monitoring"
  | "financial"
  | "vendors"
  | "reports"
  | "audit-trail"
  | "notifications"
  | "settings";

const BREADCRUMBS: Record<Page, { label: string; page?: Page }[]> = {
  dashboard: [{ label: "Home", page: "dashboard" }, { label: "Dashboard" }],
  projects: [{ label: "Home", page: "dashboard" }, { label: "Projects" }],
  "project-detail": [{ label: "Home", page: "dashboard" }, { label: "Projects", page: "projects" }, { label: "Project Details" }],
  "ai-risk": [{ label: "Home", page: "dashboard" }, { label: "AI Risk Monitoring" }],
  "fraud-alerts": [{ label: "Home", page: "dashboard" }, { label: "Alerts & Investigations" }],
  "geo-monitoring": [{ label: "Home", page: "dashboard" }, { label: "Geo-Spatial Monitoring" }],
  financial: [{ label: "Home", page: "dashboard" }, { label: "Financial Monitoring" }],
  vendors: [{ label: "Home", page: "dashboard" }, { label: "Vendors & Beneficiaries" }],
  reports: [{ label: "Home", page: "dashboard" }, { label: "Reports" }],
  "audit-trail": [{ label: "Home", page: "dashboard" }, { label: "Audit Trail" }],
  notifications: [{ label: "Home", page: "dashboard" }, { label: "Notifications" }],
  settings: [{ label: "Home", page: "dashboard" }, { label: "Administration" }],
};

import { authService } from "./services/auth";

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(() => authService.isAuthenticated());
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const handleNavigate = (page: Page, data?: any) => {
    if (page === "project-detail" && data) setSelectedProject(data);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    authService.clearUser();
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  // Build breadcrumb — for project detail, show project ID
  const breadcrumb = BREADCRUMBS[currentPage]?.map((crumb, i) => {
    if (currentPage === "project-detail" && i === 2 && selectedProject) {
      return { label: selectedProject.id };
    }
    return crumb;
  }) ?? [{ label: "Home" }];

  return (
    <DatasetProvider>
      <Layout currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} breadcrumb={breadcrumb}>
        {currentPage === "dashboard" && <Dashboard onNavigate={handleNavigate} />}
        {currentPage === "projects" && <Projects onNavigate={handleNavigate} />}
        {currentPage === "project-detail" && <ProjectDetail project={selectedProject} onNavigate={handleNavigate} />}
        {currentPage === "ai-risk" && <AIRisk onNavigate={handleNavigate} />}
        {currentPage === "fraud-alerts" && <FraudAlerts onNavigate={handleNavigate} />}
        {currentPage === "geo-monitoring" && <GeoMonitoring onNavigate={handleNavigate} />}
        {currentPage === "financial" && <FinancialAnalytics />}
        {currentPage === "vendors" && <Vendors />}
        {currentPage === "reports" && <Reports />}
        {currentPage === "audit-trail" && <AuditTrail />}
        {currentPage === "notifications" && <Notifications onNavigate={handleNavigate} />}
        {currentPage === "settings" && <Settings />}
      </Layout>
    </DatasetProvider>
  );
}
