// pages/OnboardingAgentPage.jsx — Category Onboarding: Briefing + Step 1 Ingestion (API-integrated)
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../components/Icon.jsx';
import {
  listCategories,
  createCategory,
  uploadFile,
  listFiles,
  deleteFile,
  runSwarm,
  pollJobUntilDone,
  checkInterviewReady,
} from '../services/onboardingApi.js';
import './OnboardingAgentPage.css';

export default function OnboardingAgentPage() {
  const [step, setStep] = useState('briefing'); // 'briefing' | 'ingestion'
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [stepsDropdownOpen, setStepsDropdownOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New category creation
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatOwner, setNewCatOwner] = useState('');

  // Swarm job state
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null); // { status, progress_percentage, ... }
  const [jobRunning, setJobRunning] = useState(false);
  const [interviewReady, setInterviewReady] = useState(null);

  const fileInputRef = useRef(null);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load files when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      loadFiles(selectedCategoryId);
    } else {
      setUploadedFiles([]);
    }
  }, [selectedCategoryId]);

  async function loadCategories() {
    try {
      setLoading(true);
      const data = await listCategories();
      setCategories(data);
      if (data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data[0].category_id);
      }
    } catch (err) {
      setError(`Failed to load categories: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadFiles(categoryId) {
    try {
      const files = await listFiles({ categoryId });
      setUploadedFiles(
        files.map((f) => ({
          id: f.file_id,
          name: f.original_filename || f.s3_file_name || 'Unknown',
          size: f.file_size ? `${(f.file_size / 1024).toFixed(0)} KB` : '—',
          status: 'ready',
        }))
      );
    } catch (err) {
      console.warn('Failed to load files:', err.message);
      setUploadedFiles([]);
    }
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const result = await createCategory({
        categoryName: newCatName.trim(),
        categoryOwner: newCatOwner.trim() || 'Unknown',
      });
      setShowCreateCategory(false);
      setNewCatName('');
      setNewCatOwner('');
      await loadCategories();
      setSelectedCategoryId(result.category_id);
    } catch (err) {
      setError(`Failed to create category: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleStartIngestion = () => {
    setStep('ingestion');
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    files.forEach((f) => handleUploadSingleFile(f));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => handleUploadSingleFile(f));
    e.target.value = '';
  };

  async function handleUploadSingleFile(file) {
    if (!selectedCategoryId) {
      setError('Please select a category first.');
      return;
    }

    // Add temporary entry
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    setUploadedFiles((prev) => [
      ...prev,
      { id: tempId, name: file.name, size: `${(file.size / 1024).toFixed(0)} KB`, status: 'uploading' },
    ]);

    try {
      const result = await uploadFile({
        file,
        categoryId: selectedCategoryId,
      });
      // Replace temp entry with real one
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === tempId
            ? { id: result.file_id, name: result.original_filename, size: `${(file.size / 1024).toFixed(0)} KB`, status: 'ready' }
            : f
        )
      );
    } catch (err) {
      // Mark as error
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === tempId ? { ...f, status: 'error', error: err.message } : f))
      );
      setError(`Upload failed: ${err.message}`);
    }
  }

  async function handleDeleteFile(fileId) {
    try {
      await deleteFile(fileId);
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    }
  }

  async function handleRunSwarm() {
    if (!selectedCategoryId) {
      setError('Please select a category first.');
      return;
    }
    // Get the first uploaded file for processing
    const readyFiles = uploadedFiles.filter((f) => f.status === 'ready');
    if (readyFiles.length === 0) {
      setError('Please upload at least one file before running the swarm.');
      return;
    }

    setError(null);
    setJobRunning(true);
    setJobStatus({ status: 'QUEUED', progress_percentage: 0 });
    setInterviewReady(null);

    try {
      const result = await runSwarm({
        fileId: readyFiles[0].id,
        categoryId: selectedCategoryId,
      });
      setJobId(result.job_id);

      // Poll until done
      const finalStatus = await pollJobUntilDone(result.job_id, null, {
        interval: 3000,
        onProgress: (s) => setJobStatus(s),
      });

      setJobStatus(finalStatus);

      if (finalStatus.status === 'COMPLETED') {
        // Check interview readiness
        try {
          const ready = await checkInterviewReady(selectedCategoryId);
          setInterviewReady(ready);
        } catch (err) {
          console.warn('Interview readiness check failed:', err.message);
        }
      }
    } catch (err) {
      setError(`Swarm run failed: ${err.message}`);
      setJobStatus({ status: 'FAILED', progress_percentage: 0, error_message: err.message });
    } finally {
      setJobRunning(false);
    }
  }

  if (step === 'briefing') {
    return <BriefingView onStart={handleStartIngestion} />;
  }

  const selectedCategory = categories.find((c) => c.category_id === selectedCategoryId);

  return (
    <div className="onb-page">
      {/* Sticky header */}
      <div className="onb-header">
        <div className="onb-topbar">
          <span className="onb-topbar-label">Onboarding Workflow v4</span>
          <span className="onb-topbar-sep">·</span>
          <span className="onb-topbar-meta">{selectedCategory?.category_name || 'Select category'}</span>
        </div>
        <h1 className="onb-page-title">Step 1: Category Data Ingestion &amp; Scout Scanning</h1>

        {/* Step progress indicator */}
        <div className="onb-step-indicator-wrap">
          <button className="onb-step-indicator" onClick={() => setStepsDropdownOpen((v) => !v)}>
            <div className="onb-step-dots">
              <span className="onb-dot active" />
              <span className="onb-dot" />
              <span className="onb-dot" />
              <span className="onb-dot" />
            </div>
            <span className="onb-step-label">Step 1/4</span>
            <span className="onb-step-name">Data Ingestion</span>
            <span className="onb-step-pct">{jobStatus ? `${jobStatus.progress_percentage}%` : '0%'}</span>
            <Icon name="chevronDown" size={14} className={'onb-step-chev' + (stepsDropdownOpen ? ' open' : '')} />
          </button>

          {stepsDropdownOpen && (
            <>
              <div className="onb-steps-backdrop" onClick={() => setStepsDropdownOpen(false)} />
              <div className="onb-steps-dropdown">
                <div className="onb-sd-header">
                  <span className="onb-sd-kicker">Onboarding Process</span>
                  <button className="onb-sd-collapse" onClick={() => setStepsDropdownOpen(false)}>Collapse</button>
                </div>
                <h3 className="onb-sd-title">4-Step Category Agent Setup</h3>

                <div className="onb-sd-progress">
                  <span className="onb-sd-progress-label">Overall Completion</span>
                  <span className="onb-sd-progress-pct">{jobStatus ? `${Math.round(jobStatus.progress_percentage / 4)}%` : '0%'}</span>
                </div>
                <div className="onb-sd-progress-bar">
                  <div className="onb-sd-progress-fill" style={{ width: `${jobStatus ? jobStatus.progress_percentage / 4 : 0}%` }} />
                </div>

                <div className="onb-sd-steps">
                  <div className="onb-sd-step active">
                    <span className="onb-sd-step-num active">1</span>
                    <div className="onb-sd-step-info">
                      <div className="onb-sd-step-top">
                        <div className="onb-sd-step-name">Data Ingestion</div>
                        <span className="onb-sd-step-badge active">Active</span>
                      </div>
                      <div className="onb-sd-step-desc">Upload pricing spreadsheets, detect sheets, and launch scout swarm.</div>
                    </div>
                  </div>
                  <div className="onb-sd-step">
                    <span className="onb-sd-step-num">2</span>
                    <div className="onb-sd-step-info">
                      <div className="onb-sd-step-top">
                        <div className="onb-sd-step-name">Extraction &amp; Interview</div>
                        <span className="onb-sd-step-badge">{interviewReady?.ready ? 'Ready' : 'Upcoming'}</span>
                      </div>
                      <div className="onb-sd-step-desc">Validate extracted schematics, edit rules, and complete interview.</div>
                    </div>
                  </div>
                  <div className="onb-sd-step">
                    <span className="onb-sd-step-num">3</span>
                    <div className="onb-sd-step-info">
                      <div className="onb-sd-step-top">
                        <div className="onb-sd-step-name">Revision/Validation</div>
                        <span className="onb-sd-step-badge">Upcoming</span>
                      </div>
                      <div className="onb-sd-step-desc">Run regression tests, formula verifications, and custom validations.</div>
                    </div>
                  </div>
                  <div className="onb-sd-step">
                    <span className="onb-sd-step-num">4</span>
                    <div className="onb-sd-step-info">
                      <div className="onb-sd-step-top">
                        <div className="onb-sd-step-name">Review &amp; Approve</div>
                        <span className="onb-sd-step-badge">Upcoming</span>
                      </div>
                      <div className="onb-sd-step-desc">Final sign-off, register category model card, and deploy.</div>
                    </div>
                  </div>
                </div>

                <div className="onb-sd-footer">
                  <span>Current step state is saved automatically.</span>
                  <span className="onb-sd-footer-cat">{selectedCategory?.category_name || ''}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="onb-error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Main layout: left content + right telemetry panel */}
      <div className="onb-ingestion-layout">
        {/* Left: main content */}
        <div className="onb-ingestion-main">
          <div className="onb-ingestion-card">
            <h2 className="onb-ing-title">Step 1: Data Ingestion &amp; Prep</h2>
            <p className="onb-ing-sub">
              Configure your pricing category template below. You may also drop custom spreadsheets containing base rate indices, contracts, or parameters.
            </p>

            {/* Target Pricing Category dropdown */}
            <div className="onb-section-label">Target Pricing Category</div>
            <div className="onb-category-select">
              <select
                className="onb-category-dropdown"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                disabled={loading}
              >
                <option value="">— Select category —</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
              <Icon name="chevronDown" size={16} className="onb-category-chevron" />
            </div>

            {/* Create new category */}
            <button className="onb-create-cat-btn" onClick={() => setShowCreateCategory((v) => !v)}>
              + New Category
            </button>

            {showCreateCategory && (
              <div className="onb-new-cat-form">
                <input
                  className="onb-input"
                  placeholder="Category name (e.g. Adhesives)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <input
                  className="onb-input"
                  placeholder="Owner name (e.g. Sarah Jenkins)"
                  value={newCatOwner}
                  onChange={(e) => setNewCatOwner(e.target.value)}
                />
                <div className="onb-new-cat-actions">
                  <button className="onb-btn-primary" onClick={handleCreateCategory} disabled={loading || !newCatName.trim()}>
                    Create
                  </button>
                  <button className="onb-btn-secondary" onClick={() => setShowCreateCategory(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Upload area */}
            <div className="onb-section-label">Add/Replace Supporting Documents (Optional)</div>
            <div
              className="onb-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
            >
              <Icon name="send" size={24} style={{ opacity: 0.5 }} />
              <p>
                Drag and drop spreadsheet files, or{' '}
                <button className="onb-browse-link" onClick={() => fileInputRef.current?.click()}>
                  browse folder
                </button>
              </p>
              <span className="onb-dropzone-hint">Supports Excel (.xlsx, .xls) — Max 10MB per file</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>

            {/* Active dataset documents */}
            <div className="onb-section-label onb-section-label--accent">
              Active Dataset Documents ({uploadedFiles.length})
            </div>
            <div className="onb-file-list">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="onb-file-item">
                  <span className="onb-file-icon"><Icon name="file" size={16} /></span>
                  <span className="onb-file-name">{file.name}</span>
                  <span className="onb-file-size">({file.size})</span>
                  <span className={`onb-file-status onb-file-status--${file.status}`}>
                    {file.status === 'uploading' ? 'Uploading…' : file.status === 'error' ? 'Error' : 'Ready for mapping'}
                  </span>
                  <button
                    className="onb-file-delete"
                    onClick={() => handleDeleteFile(file.id)}
                    disabled={file.status === 'uploading'}
                  >
                    Delete
                  </button>
                </div>
              ))}
              {uploadedFiles.length === 0 && (
                <div className="onb-file-empty">No files uploaded yet. Upload an Excel workbook to begin.</div>
              )}
            </div>

            {/* Run button */}
            <button
              className="onb-run-btn"
              onClick={handleRunSwarm}
              disabled={jobRunning || uploadedFiles.filter((f) => f.status === 'ready').length === 0}
            >
              <Icon name="skip" size={16} />
              {jobRunning ? 'Processing…' : 'Run Background Scout Swarm'}
            </button>
          </div>
        </div>

        {/* Right: telemetry panel */}
        <div className="onb-telemetry">
          <div className="onb-telem-card">
            <div className="onb-telem-header">
              <span className={`onb-telem-dot${jobRunning ? ' running' : ''}`} />
              <span>DIM Swarm Telemetry</span>
              <button className="onb-telem-expand" title="Expand"><Icon name="copy" size={14} /></button>
            </div>
            <div className="onb-telem-body">
              {/* Show job progress when running */}
              {jobStatus && (
                <div className="onb-telem-progress">
                  <div className="onb-telem-progress-bar">
                    <div
                      className="onb-telem-progress-fill"
                      style={{ width: `${jobStatus.progress_percentage}%` }}
                    />
                  </div>
                  <div className="onb-telem-progress-label">
                    {jobStatus.status} — {jobStatus.progress_percentage}%
                  </div>
                  {jobStatus.error_message && (
                    <div className="onb-telem-error">{jobStatus.error_message}</div>
                  )}
                </div>
              )}

              {!jobStatus && (
                <>
                  <div className="onb-telem-icon">
                    <Icon name="layers" size={32} />
                  </div>
                  <h3 className="onb-telem-title">Scout Agent Intelligence</h3>
                  <p className="onb-telem-desc">
                    Spawns local agent scripts to index formulas, variables, worksheets, and relational mappings with zero prompt hallucination.
                  </p>
                </>
              )}

              <div className="onb-telem-status">
                <Icon name="clock" size={18} />
                <div>
                  <div className="onb-telem-status-title">
                    {jobRunning
                      ? `Running: ${jobStatus?.status || 'QUEUED'}`
                      : jobStatus?.status === 'COMPLETED'
                        ? '✓ Extraction Complete'
                        : jobStatus?.status === 'FAILED'
                          ? '✕ Processing Failed'
                          : 'Awaiting Ingestion Run'}
                  </div>
                  <div className="onb-telem-status-sub">
                    {jobRunning
                      ? 'Processing your workbook. This may take 1-3 minutes depending on file size.'
                      : jobStatus?.status === 'COMPLETED'
                        ? 'Tables extracted and enriched. Ready for interview step.'
                        : 'Select category and trigger background scouting swarm to compile mathematical schemas.'}
                  </div>
                </div>
              </div>

              {/* Interview readiness */}
              {interviewReady && (
                <div className="onb-telem-interview">
                  <div className="onb-telem-interview-label">
                    Interview Ready: {interviewReady.ready ? '✓ Yes' : '✕ Not yet'}
                  </div>
                  {interviewReady.ready && (
                    <div className="onb-telem-interview-hint">
                      Extraction and enrichment artifacts are available. Proceed to Step 2.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="onb-telem-footer">
              <span>Deterministic Runtime</span>
              <span>v4 Proto Engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Briefing sub-view (initial screen) ───────────────────── */
function BriefingView({ onStart }) {
  return (
    <div className="onb-page">
      <div className="onb-header">
        <div className="onb-topbar">
          <span className="onb-topbar-label">Onboarding Workflow v4</span>
          <span className="onb-topbar-sep">·</span>
          <span className="onb-topbar-meta">Category Onboarding</span>
        </div>
        <h1 className="onb-page-title">Category Onboarding Briefing</h1>
      </div>

      <div className="onb-card">
        <div className="onb-badge">
          <Icon name="sparkles" size={16} />
          <span>Start Model Onboarding</span>
        </div>

        <h2 className="onb-card-title">Pricing Category Integration &amp; Validation Briefing</h2>
        <p className="onb-card-sub">
          Welcome to the IM&amp;S direct model card generator. This smart workspace automates the translation of unstructured business agreements into bulletproof, deterministic pricing algorithms.
        </p>

        <div className="onb-columns">
          <div className="onb-col">
            <h3 className="onb-col-title"><span className="onb-col-num">1.</span> What We Will Achieve &amp; Prepare</h3>

            <div className="onb-item">
              <span className="onb-item-icon"><Icon name="file" size={16} /></span>
              <div>
                <span className="onb-item-label">Workbook Parsing:</span>{' '}
                The background Scout Swarm scans nested sheets to index cost drivers, zones, base contracts, and historical indices.
              </div>
            </div>

            <div className="onb-item">
              <span className="onb-item-icon"><Icon name="database" size={16} /></span>
              <div>
                <span className="onb-item-label">What to Keep Available:</span>{' '}
                Prepare pricing matrices, spot driver exposure rates, volume tiers, and supplier-specific rebate agreements.
              </div>
            </div>

            <div className="onb-item">
              <span className="onb-item-icon"><Icon name="check" size={16} /></span>
              <div>
                <span className="onb-item-label">Outcome:</span>{' '}
                Generate a peer-reviewed <strong>Model Card</strong> that binds your commercial equations to raw database columns.
              </div>
            </div>
          </div>

          <div className="onb-col">
            <h3 className="onb-col-title"><span className="onb-col-num">2.</span> Process Steps &amp; Estimations</h3>

            <div className="onb-step">
              <span className="onb-step-name">Step 1: Ingestion Swarm</span>
              <span className="onb-step-time">1-3 min scan</span>
            </div>
            <div className="onb-step">
              <span className="onb-step-name">Step 2: Extraction &amp; interview</span>
              <span className="onb-step-time">3-5 min interactive</span>
            </div>
            <div className="onb-step">
              <span className="onb-step-name">Step 3: Verification regression tests</span>
              <span className="onb-step-time">1 min validation</span>
            </div>
            <div className="onb-step">
              <span className="onb-step-name">Step 4: Final review &amp; live deploy</span>
              <span className="onb-step-time">Instant registration</span>
            </div>

            <div className="onb-estimate">
              <span className="onb-estimate-icon"><Icon name="clock" size={14} /></span>
              <span className="onb-estimate-label">Completion estimate:</span>
              <span className="onb-estimate-value">~5-10 minutes total</span>
              <span className="onb-estimate-goal">to achieve 100% pricing clarity.</span>
            </div>
          </div>
        </div>

        <div className="onb-card-footer">
          <span className="onb-ready-label">Ready to Begin Integrating</span>
          <button className="onb-start-btn" onClick={onStart}>
            Start Ingestion Process
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
