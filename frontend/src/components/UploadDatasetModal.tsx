import React, { useState, useRef, useEffect } from "react";
import { api } from "../services/api";
import { useDataset } from "../context/DatasetContext";

interface UploadDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteNavigate?: (page: string) => void;
}

type Stage = "SELECT" | "PREVIEW" | "PROCESSING" | "COMPLETE" | "ERROR";

const STAGES_LIST = [
  "Upload Complete",
  "Schema & Integrity Check",
  "Normalization & Standardizing IDs",
  "Feature Engineering (56 Signals)",
  "Unsupervised ML Scoring (Isolation Forest + LOF)",
  "Deterministic Rules & Risk Scoring (0–100)",
  "Analytical CSV Exports Generation",
  "Database Persistence & Atomic Activation",
];

export function UploadDatasetModal({ isOpen, onClose, onCompleteNavigate }: UploadDatasetModalProps) {
  const { switchDatasetVersion, refreshDatasets } = useDataset();

  const [stage, setStage] = useState<Stage>("SELECT");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [datasetName, setDatasetName] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Validation state
  const [validating, setValidating] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // Processing state
  const [runId, setRunId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [currentStepName, setCurrentStepName] = useState<string>("Initializing...");
  const [runStats, setRunStats] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimeoutRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);

  // Restore or reset state on open
  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      setStage("SELECT");
      setSelectedFiles([]);
      setMode("replace");
      setDatasetName("");
      setUploadResult(null);
      setRunId(null);
      setProgress(0);
      setErrorMessage("");
      setRunStats(null);
    }
    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv")) {
        valid.push(f);
      }
    }
    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Step 1 -> Step 2: Validate Files
  const handleValidate = async () => {
    if (selectedFiles.length === 0) return;
    setValidating(true);
    setErrorMessage("");
    try {
      const res = await api.uploadDataset(selectedFiles, mode, datasetName);
      setUploadResult(res);
      setStage("PREVIEW");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to validate uploaded files");
    } finally {
      setValidating(false);
    }
  };

  // Step 2 -> Step 3: Process & Run AI Analysis
  const handleProcess = async () => {
    if (!uploadResult) return;
    setStage("PROCESSING");
    setProgress(5);
    setCurrentStepName("Queuing ML Analysis Pipeline...");

    try {
      const triggerRes = await api.triggerAIAnalysis({
        upload_id: uploadResult.upload_id,
        dataset_version: uploadResult.dataset_version,
        dataset_name: uploadResult.dataset_name,
        mode: mode,
      });

      const currentRunId = triggerRes.run_id;
      setRunId(currentRunId);

      // Safe recursive polling loop with retry tolerance
      let consecutiveErrors = 0;

      const pollStatus = async () => {
        if (!isMountedRef.current) return;

        try {
          const runStatus = await api.getAIRunStatus(currentRunId);
          consecutiveErrors = 0; // reset error count on success

          if (!isMountedRef.current) return;

          setProgress(runStatus.progress || 10);
          setCurrentStepName(runStatus.stage || "Processing AI Pipeline...");
          setRunStats(runStatus);

          if (runStatus.status === "COMPLETED") {
            setStage("COMPLETE");
            await refreshDatasets();
            return;
          } else if (runStatus.status === "FAILED") {
            setErrorMessage(runStatus.error_message || "Dataset processing encountered an error. Baseline dataset remains active.");
            setStage("ERROR");
            return;
          }

          // Continue polling while in progress
          pollTimeoutRef.current = setTimeout(pollStatus, 1200);
        } catch (e: any) {
          consecutiveErrors += 1;
          console.warn(`[AI Polling] Attempt ${consecutiveErrors} notice:`, e);

          if (consecutiveErrors < 15) {
            // Transient error / network glitch: wait and retry safely
            if (isMountedRef.current) {
              setCurrentStepName("Analyzing ML models (connecting to worker)...");
              pollTimeoutRef.current = setTimeout(pollStatus, 2000);
            }
          } else {
            // Persistent error
            if (isMountedRef.current) {
              setErrorMessage("Temporary communication issue with backend analysis worker. Analysis may still be executing.");
              setStage("ERROR");
            }
          }
        }
      };

      // Start initial poll
      pollTimeoutRef.current = setTimeout(pollStatus, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to start analysis");
      setStage("ERROR");
    }
  };

  const handleFinishAndNavigate = async () => {
    if (uploadResult?.dataset_version) {
      await switchDatasetVersion(uploadResult.dataset_version);
    }
    onClose();
    if (onCompleteNavigate) {
      onCompleteNavigate("dashboard");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 34, 68, 0.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: "6px", width: "100%", maxWidth: "860px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", border: "1px solid #D0D5DD" }}>
        {/* Header */}
        <div style={{ background: "#1B3A6B", color: "#fff", padding: "14px 20px", borderTopLeftRadius: "5px", borderTopRightRadius: "5px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #F97316" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.02em" }}>Upload & Analyze MPLAD Datasets</div>
            <div style={{ fontSize: "11px", opacity: 0.85 }}>Autonomous Ingestion, Schema Auto-Classification & AI Risk Calibration</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer", opacity: 0.85, lineHeight: 1 }}>×</button>
        </div>

        {/* Stepper bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: "11px", fontWeight: 600 }}>
          {[
            { id: "SELECT", label: "1. Select Files" },
            { id: "PREVIEW", label: "2. Schema & Preview" },
            { id: "PROCESSING", label: "3. ML Execution" },
            { id: "COMPLETE", label: "4. Activation" },
          ].map((s, idx) => {
            const isCurrent = stage === s.id;
            const isPassed =
              (s.id === "SELECT" && stage !== "SELECT") ||
              (s.id === "PREVIEW" && (stage === "PROCESSING" || stage === "COMPLETE")) ||
              (s.id === "PROCESSING" && stage === "COMPLETE");
            return (
              <div
                key={idx}
                style={{
                  padding: "10px",
                  textAlign: "center",
                  borderBottom: isCurrent ? "3px solid #1B3A6B" : "3px solid transparent",
                  color: isCurrent ? "#1B3A6B" : isPassed ? "#15803D" : "#94A3B8",
                  background: isCurrent ? "#EFF6FF" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span>{isPassed ? "✓" : idx + 1}</span>
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {errorMessage && (
            <div style={{ background: "#FEE2E2", border: "1px solid #DC2626", borderRadius: "4px", padding: "10px 14px", color: "#B91C1C", fontSize: "12px", marginBottom: "16px" }}>
              <strong>Error: </strong> {errorMessage}
            </div>
          )}

          {/* STAGE 1: FILE SELECTION */}
          {stage === "SELECT" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Dataset Version Label (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MPLAD Q3 2026 Refresh"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Ingestion Mode
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", cursor: "pointer", background: mode === "replace" ? "#EFF6FF" : "#fff", padding: "6px 10px", border: "1px solid #CBD5E1", borderRadius: "4px", flex: 1 }}>
                      <input type="radio" name="mode" checked={mode === "replace"} onChange={() => setMode("replace")} />
                      <span>Replace</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", cursor: "pointer", background: mode === "append" ? "#EFF6FF" : "#fff", padding: "6px 10px", border: "1px solid #CBD5E1", borderRadius: "4px", flex: 1 }}>
                      <input type="radio" name="mode" checked={mode === "append"} onChange={() => setMode("append")} />
                      <span>Append</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? "2px dashed #1B3A6B" : "2px dashed #CBD5E1",
                  background: isDragging ? "#EFF6FF" : "#F8FAFC",
                  borderRadius: "6px",
                  padding: "28px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  marginBottom: "16px",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".xlsx,.xls,.csv"
                  style={{ display: "none" }}
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📁</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#1B3A6B", marginBottom: "4px" }}>
                  Drag & Drop Excel (.xlsx, .xls) or CSV files here, or click to browse
                </div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>
                  Supports single datasets or complete 6-file suite (Sanctioned, Recommended, Completed, Expenditure, Calamity, Allocation)
                </div>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div style={{ border: "1px solid #E2E8F0", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
                  <div style={{ background: "#F1F5F9", padding: "8px 12px", fontSize: "11px", fontWeight: 700, color: "#475569", display: "flex", justifyContent: "space-between" }}>
                    <span>Selected Files ({selectedFiles.length})</span>
                    <span>Total: {formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))}</span>
                  </div>
                  <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} style={{ padding: "8px 12px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>📄</span>
                          <span style={{ fontWeight: 600, color: "#1E293B" }}>{file.name}</span>
                          <span style={{ fontSize: "10px", color: "#64748B", background: "#E2E8F0", padding: "1px 6px", borderRadius: "3px" }}>{formatBytes(file.size)}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: "14px", fontWeight: 700 }}
                          title="Remove File"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAGE 2: VALIDATION & PREVIEW */}
          {stage === "PREVIEW" && uploadResult && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "4px", padding: "10px" }}>
                  <div style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase" }}>Version Assigned</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#1B3A6B" }}>{uploadResult.dataset_version}</div>
                  <div style={{ fontSize: "10px", color: "#64748B" }}>{uploadResult.dataset_name}</div>
                </div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "4px", padding: "10px" }}>
                  <div style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase" }}>Total Records</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#1E293B" }}>{uploadResult.validation_report?.total_records?.toLocaleString()}</div>
                  <div style={{ fontSize: "10px", color: "#15803D" }}>100% Valid Structure</div>
                </div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "4px", padding: "10px" }}>
                  <div style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase" }}>Files Detected</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#1E293B" }}>{uploadResult.validation_report?.file_count}</div>
                  <div style={{ fontSize: "10px", color: "#64748B" }}>{uploadResult.validation_report?.detected_types?.join(", ")}</div>
                </div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "4px", padding: "10px" }}>
                  <div style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase" }}>Duplicates</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: uploadResult.validation_report?.total_duplicates > 0 ? "#EA580C" : "#15803D" }}>
                    {uploadResult.validation_report?.total_duplicates || 0}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748B" }}>Auto-Deduplicated</div>
                </div>
              </div>

              {/* Multi-File Classification Table */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
                <div style={{ background: "#F1F5F9", padding: "8px 12px", fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                  Detected Schemas & Classification
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
                      <th style={{ padding: "6px 10px" }}>File Name</th>
                      <th style={{ padding: "6px 10px" }}>Detected Type</th>
                      <th style={{ padding: "6px 10px" }}>Rows</th>
                      <th style={{ padding: "6px 10px" }}>Valid</th>
                      <th style={{ padding: "6px 10px" }}>Warnings</th>
                      <th style={{ padding: "6px 10px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.validation_report?.files?.map((f: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "6px 10px", fontWeight: 600 }}>{f.filename}</td>
                        <td style={{ padding: "6px 10px" }}>
                          <span style={{ background: "#DBEAFE", color: "#1D4ED8", padding: "2px 6px", borderRadius: "3px", fontWeight: 700, fontSize: "10px" }}>
                            {f.detected_type}
                          </span>
                        </td>
                        <td style={{ padding: "6px 10px", fontFamily: "monospace" }}>{f.total_rows?.toLocaleString()}</td>
                        <td style={{ padding: "6px 10px", color: "#15803D", fontFamily: "monospace" }}>{f.valid_rows?.toLocaleString()}</td>
                        <td style={{ padding: "6px 10px", color: f.warnings?.length ? "#D97706" : "#64748B" }}>
                          {f.warnings?.length ? `${f.warnings.length} items` : "None"}
                        </td>
                        <td style={{ padding: "6px 10px" }}>
                          <span style={{ color: "#15803D", fontWeight: 700 }}>✓ {f.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sample Rows Preview */}
              {uploadResult.validation_report?.files?.[0]?.sample_rows?.length > 0 && (
                <div style={{ border: "1px solid #E2E8F0", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
                  <div style={{ background: "#F1F5F9", padding: "8px 12px", fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                    Sample Rows Preview ({uploadResult.validation_report.files[0].filename})
                  </div>
                  <div style={{ maxHeight: "160px", overflowX: "auto", overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                      <thead>
                        <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
                          {Object.keys(uploadResult.validation_report.files[0].sample_rows[0]).map((col, idx) => (
                            <th key={idx} style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResult.validation_report.files[0].sample_rows.slice(0, 5).map((row: any, rIdx: number) => (
                          <tr key={rIdx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                            {Object.values(row).map((val: any, cIdx: number) => (
                              <td key={cIdx} style={{ padding: "4px 8px", whiteSpace: "nowrap", maxWidth: "200px", textOverflow: "ellipsis", overflow: "hidden" }}>
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAGE 3: LIVE ML PROCESSING */}
          {stage === "PROCESSING" && (
            <div style={{ padding: "10px 0" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#1B3A6B", marginBottom: "4px" }}>
                  Executing AI Risk & Ingestion Pipeline
                </div>
                <div style={{ fontSize: "12px", color: "#64748B" }}>{currentStepName}</div>
              </div>

              {/* Progress Bar */}
              <div style={{ background: "#E2E8F0", borderRadius: "6px", height: "12px", overflow: "hidden", marginBottom: "16px" }}>
                <div
                  style={{
                    background: "linear-gradient(90deg, #1B3A6B, #F97316)",
                    height: "100%",
                    width: `${progress}%`,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748B", marginBottom: "20px" }}>
                <span>Run ID: {runId || "RUN-LIVE"}</span>
                <span style={{ fontWeight: 700, color: "#1B3A6B" }}>{progress}% Complete</span>
              </div>

              {/* 8-Stage Visual Stepper */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
                {STAGES_LIST.map((stepName, sIdx) => {
                  const stepThreshold = (sIdx + 1) * 12.5;
                  const isDone = progress >= stepThreshold;
                  const isCurrent = progress < stepThreshold && progress >= stepThreshold - 12.5;
                  return (
                    <div
                      key={sIdx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 10px",
                        borderRadius: "4px",
                        background: isDone ? "#DCFCE7" : isCurrent ? "#EFF6FF" : "#F8FAFC",
                        border: isDone ? "1px solid #86EFAC" : isCurrent ? "1px solid #93C5FD" : "1px solid #E2E8F0",
                        fontSize: "11px",
                      }}
                    >
                      <span style={{ color: isDone ? "#15803D" : isCurrent ? "#2563EB" : "#94A3B8", fontWeight: 700 }}>
                        {isDone ? "✓" : isCurrent ? "⟳" : "○"}
                      </span>
                      <span style={{ color: isDone ? "#166534" : isCurrent ? "#1E40AF" : "#64748B", fontWeight: isCurrent ? 700 : 500 }}>
                        {stepName}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Live KPI Counters */}
              {runStats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", background: "#F1F5F9", padding: "12px", borderRadius: "4px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#64748B" }}>ANALYZED</div>
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>{runStats.projects_analyzed?.toLocaleString() || "—"}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#DC2626" }}>CRITICAL</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#DC2626" }}>{runStats.critical ?? "—"}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#EA580C" }}>HIGH</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#EA580C" }}>{runStats.high ?? "—"}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#D97706" }}>MEDIUM</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#D97706" }}>{runStats.medium ?? "—"}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#15803D" }}>LOW</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#15803D" }}>{runStats.low ?? "—"}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAGE 4: COMPLETE & ACTIVATION */}
          {stage === "COMPLETE" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "48px", color: "#15803D", marginBottom: "10px" }}>✓</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#1B3A6B", marginBottom: "4px" }}>
                Dataset {uploadResult?.dataset_version} Processed & Activated Successfully!
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "20px" }}>
                {uploadResult?.dataset_name} is now the active dataset across all dashboards, charts, AI risk models, and reports.
              </div>

              <div style={{ maxWidth: "480px", margin: "0 auto 24px auto", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", textAlign: "left", fontSize: "12px" }}>
                <div>
                  <span style={{ color: "#64748B" }}>Projects Ingested:</span>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>{runStats?.projects_analyzed?.toLocaleString() || uploadResult?.validation_report?.total_records?.toLocaleString()}</div>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Active Version:</span>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#1B3A6B" }}>{uploadResult?.dataset_version}</div>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Critical & High Anomalies:</span>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#DC2626" }}>{(runStats?.critical || 0) + (runStats?.high || 0)}</div>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>New Alerts Generated:</span>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#EA580C" }}>{runStats?.alerts_generated || (runStats?.critical || 0) + (runStats?.high || 0)}</div>
                </div>
              </div>
            </div>
          )}

          {/* ERROR STAGE */}
          {stage === "ERROR" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "48px", color: "#DC2626", marginBottom: "10px" }}>⚠</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#B91C1C", marginBottom: "4px" }}>
                Dataset Processing Failed
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "16px" }}>
                The previous active dataset version remains active and untouched.
              </div>
              <div style={{ background: "#FEE2E2", border: "1px solid #DC2626", borderRadius: "4px", padding: "12px", color: "#B91C1C", fontSize: "12px", maxWidth: "540px", margin: "0 auto 20px auto", textAlign: "left" }}>
                {errorMessage}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {stage === "SELECT" && (
            <>
              <button onClick={onClose} style={{ padding: "7px 14px", background: "#fff", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={handleValidate}
                disabled={selectedFiles.length === 0 || validating}
                style={{
                  padding: "7px 18px",
                  background: selectedFiles.length === 0 || validating ? "#94A3B8" : "#1B3A6B",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: selectedFiles.length === 0 || validating ? "not-allowed" : "pointer",
                }}
              >
                {validating ? "Validating Schemas..." : `Upload & Validate (${selectedFiles.length} files) →`}
              </button>
            </>
          )}

          {stage === "PREVIEW" && (
            <>
              <button onClick={() => setStage("SELECT")} style={{ padding: "7px 14px", background: "#fff", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>
                ← Back
              </button>
              <button
                onClick={handleProcess}
                style={{ padding: "8px 20px", background: "#F97316", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
              >
                ▶ Process Dataset & Run AI Analysis
              </button>
            </>
          )}

          {stage === "PROCESSING" && (
            <div style={{ fontSize: "11px", color: "#64748B", fontStyle: "italic", width: "100%", textAlign: "center" }}>
              Please do not close this window while AI inference and database synchronization are executing.
            </div>
          )}

          {stage === "COMPLETE" && (
            <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", gap: "10px" }}>
              <button onClick={onClose} style={{ padding: "7px 14px", background: "#fff", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>
                Close
              </button>
              <button
                onClick={handleFinishAndNavigate}
                style={{ padding: "8px 22px", background: "#15803D", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
              >
                View Updated Dashboard →
              </button>
            </div>
          )}

          {stage === "ERROR" && (
            <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", gap: "10px" }}>
              <button onClick={onClose} style={{ padding: "7px 14px", background: "#fff", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>
                Close
              </button>
              <button
                onClick={() => setStage("SELECT")}
                style={{ padding: "7px 16px", background: "#1B3A6B", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
