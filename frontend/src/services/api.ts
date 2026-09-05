const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

let currentDatasetVersion = "V1";

export function setCurrentDatasetVersion(v: string) {
  if (v && v.trim()) {
    currentDatasetVersion = v.trim();
  }
}

export function getCurrentDatasetVersion(): string {
  return currentDatasetVersion;
}

function withVersion(endpoint: string, explicitVersion?: string): string {
  const ver = explicitVersion || currentDatasetVersion;
  if (!ver) return endpoint;
  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}dataset_version=${encodeURIComponent(ver)}`;
}

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const err = await response.json();
      if (err.detail) errorMsg = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
      else if (err.message) errorMsg = err.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  setCurrentDatasetVersion,
  getCurrentDatasetVersion,

  // Health check
  getHealth: () => fetchJSON<any>("/api/health"),
  getReadiness: () => fetchJSON<any>("/api/health/ready"),

  // Dataset Management
  getDatasetVersions: () => fetchJSON<any[]>("/api/data/datasets"),
  getActiveDataset: () => fetchJSON<any>("/api/data/datasets/active"),
  activateDatasetVersion: (version: string) =>
    fetchJSON<any>(`/api/data/datasets/${encodeURIComponent(version)}/activate`, {
      method: "POST",
    }),
  uploadDataset: async (files: File[], mode: string = "replace", datasetName?: string) => {
    const formData = new FormData();
    for (const f of files) {
      formData.append("files", f);
    }
    const q = new URLSearchParams();
    q.append("mode", mode);
    if (datasetName) q.append("dataset_name", datasetName);

    const uploadUrl = `${API_BASE}/api/data/upload?${q.toString()}`;
    const res = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let errText = `Upload failed with status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) errText = errJson.detail;
      } catch (_) {}
      throw new Error(errText);
    }
    return res.json();
  },

  // Dashboard
  getDashboardSummary: (ver?: string) => fetchJSON<any>(withVersion("/api/dashboard/summary", ver)),
  getFundUtilization: (timeframe = "monthly", ver?: string) =>
    fetchJSON<any[]>(withVersion(`/api/dashboard/fund-utilization?timeframe=${timeframe}`, ver)),
  getProjectStatus: (ver?: string) => fetchJSON<any[]>(withVersion("/api/dashboard/project-status", ver)),
  getRiskDistribution: (ver?: string) => fetchJSON<any[]>(withVersion("/api/dashboard/risk-distribution", ver)),
  getRiskTrend: (ver?: string) => fetchJSON<any[]>(withVersion("/api/dashboard/risk-trend", ver)),
  getAnomalyCategories: (ver?: string) => fetchJSON<any[]>(withVersion("/api/dashboard/anomaly-categories", ver)),
  getVendorDistribution: (top = 6, ver?: string) =>
    fetchJSON<any[]>(withVersion(`/api/dashboard/vendor-distribution?top=${top}`, ver)),
  getDistrictExpenditure: (top = 6, ver?: string) =>
    fetchJSON<any[]>(withVersion(`/api/dashboard/district-expenditure?top=${top}`, ver)),
  getCostOverrun: (ver?: string) => fetchJSON<any[]>(withVersion("/api/dashboard/cost-overrun", ver)),
  getGeoProjects: (ver?: string) => fetchJSON<{ states: any[]; markers: any[] }>(withVersion("/api/dashboard/geo-projects", ver)),

  // Projects
  listProjects: (params: {
    dataset_version?: string;
    search?: string;
    state?: string;
    risk_level?: string;
    status?: string;
    category?: string;
    sort_by?: string;
    sort_dir?: string;
    page?: number;
    page_size?: number;
  }) => {
    const q = new URLSearchParams();
    q.append("dataset_version", params.dataset_version || currentDatasetVersion);
    if (params.search) q.append("search", params.search);
    if (params.state) q.append("state", params.state);
    if (params.risk_level) q.append("risk_level", params.risk_level);
    if (params.status) q.append("status", params.status);
    if (params.category) q.append("category", params.category);
    if (params.sort_by) q.append("sort_by", params.sort_by);
    if (params.sort_dir) q.append("sort_dir", params.sort_dir);
    if (params.page) q.append("page", params.page.toString());
    if (params.page_size) q.append("page_size", params.page_size.toString());
    return fetchJSON<{
      items: any[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
      available_states: string[];
      available_categories: string[];
    }>(`/api/projects?${q.toString()}`);
  },
  getProjectDetail: (workId: string, ver?: string) =>
    fetchJSON<any>(withVersion(`/api/projects/${encodeURIComponent(workId)}`, ver)),

  // Alerts
  listAlerts: (params?: { dataset_version?: string; severity?: string; status?: string; search?: string; limit?: number }) => {
    const q = new URLSearchParams();
    q.append("dataset_version", params?.dataset_version || currentDatasetVersion);
    if (params?.severity) q.append("severity", params.severity);
    if (params?.status) q.append("status", params.status);
    if (params?.search) q.append("search", params.search);
    if (params?.limit) q.append("limit", params.limit.toString());
    return fetchJSON<{
      counts: { critical: number; high: number; medium: number; resolved: number };
      items: any[];
      total: number;
    }>(`/api/alerts?${q.toString()}`);
  },
  updateAlertStatus: (alertId: string, status: string, notes?: string, assignedTo?: string) =>
    fetchJSON<any>(`/api/alerts/${alertId}/status`, {
      method: "POST",
      body: JSON.stringify({ status, notes, assigned_to: assignedTo }),
    }),
  investigateAlert: (alertId: string) =>
    fetchJSON<any>(`/api/alerts/${alertId}/investigate`, { method: "POST" }),
  resolveAlert: (alertId: string, notes?: string) =>
    fetchJSON<any>(`/api/alerts/${alertId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    }),
  escalateAlert: (alertId: string, notes?: string) =>
    fetchJSON<any>(`/api/alerts/${alertId}/escalate`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    }),

  // AI
  triggerAIAnalysis: (payload: {
    upload_id?: string;
    dataset_version?: string;
    mode?: string;
    dataset_name?: string;
    date_from?: string;
    date_to?: string;
    anomaly_type?: string;
  }) =>
    fetchJSON<any>("/api/ai/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAIRunStatus: (runId: string) => fetchJSON<any>(`/api/ai/runs/${encodeURIComponent(runId)}`),
  getAIModelStatus: (ver?: string) => fetchJSON<any>(withVersion("/api/ai/model-status", ver)),
  getAIAnomalies: (filterType = "All Types", ver?: string) =>
    fetchJSON<any[]>(withVersion(`/api/ai/anomalies?filter_type=${encodeURIComponent(filterType)}`, ver)),

  // Vendors & Beneficiaries
  listVendors: (search?: string, ver?: string) => {
    const q = new URLSearchParams();
    q.append("dataset_version", ver || currentDatasetVersion);
    if (search) q.append("search", search);
    return fetchJSON<any[]>(`/api/vendors?${q.toString()}`);
  },
  getBeneficiariesSummary: (ver?: string) => fetchJSON<any>(withVersion("/api/vendors/beneficiaries-summary", ver)),

  // Audit
  getAuditTrail: (params?: { search?: string; module?: string; role?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.module) q.append("module", params.module);
    if (params?.role) q.append("role", params.role);
    return fetchJSON<any[]>(`/api/audit-trail?${q.toString()}`);
  },
  recordAuditEvent: (payload: {
    action: string;
    module: string;
    project_id?: string;
    old_value?: string;
    new_value?: string;
    user?: string;
    role?: string;
  }) =>
    fetchJSON<any>("/api/audit-trail", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Reports
  generateReport: (payload: any, ver?: string) =>
    fetchJSON<any>("/api/reports/generate", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        dataset_version: ver || currentDatasetVersion,
      }),
    }),
};
