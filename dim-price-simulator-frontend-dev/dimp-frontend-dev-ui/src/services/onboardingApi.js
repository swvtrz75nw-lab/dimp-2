/**
 * Onboarding Service API client.
 *
 * Connects to the onboarding backend at /api/onboarding_service/v1
 * Handles: categories, file upload, swarm job execution, job polling,
 * interview readiness, and model card operations.
 */

const ONBOARDING_BASE = import.meta.env.VITE_ONBOARDING_API_URL || '';
const API_PREFIX = '/api/onboarding_service/v1';

function url(path) {
    return `${ONBOARDING_BASE}${API_PREFIX}${path}`;
}

// ─── Helpers ────────────────────────────────────────────────

async function json(res) {
    if (!res.ok) {
        const body = await res.text();
        let detail = body;
        try { detail = JSON.parse(body).detail || body; } catch { }
        throw new Error(detail);
    }
    return res.json();
}

// ─── Categories ─────────────────────────────────────────────

/**
 * List categories (optional filter by user).
 * GET /categories/?user_id=
 */
export async function listCategories(userId) {
    const params = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const res = await fetch(url(`/categories/${params}`));
    return json(res);
}

/**
 * Create a new category.
 * POST /categories/
 */
export async function createCategory({ categoryName, categoryOwner, userId, commercialClassification, businessContext }) {
    const res = await fetch(url('/categories/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            category_name: categoryName,
            category_owner: categoryOwner,
            user_id: userId || null,
            commercial_classification: commercialClassification || '',
            business_context: businessContext || '',
        }),
    });
    return json(res);
}

/**
 * Get category details (full model card).
 * GET /categories/{category_id}
 */
export async function getCategory(categoryId, userId) {
    const params = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const res = await fetch(url(`/categories/${categoryId}${params}`));
    return json(res);
}

// ─── Files ──────────────────────────────────────────────────

/**
 * Upload an Excel file for a category.
 * POST /files/upload (multipart/form-data)
 */
export async function uploadFile({ file, categoryId, userId, isRestricted = false, filePurpose = '', refreshFrequency = '', sourceType = '', fileOwner = '' }) {
    const form = new FormData();
    form.append('file', file);
    form.append('category_id', categoryId);
    form.append('user_id', userId || 'anonymous');
    form.append('is_restricted', String(isRestricted));
    form.append('file_purpose', filePurpose);
    form.append('refresh_frequency', refreshFrequency);
    form.append('source_type', sourceType);
    form.append('file_owner', fileOwner);

    const res = await fetch(url('/files/upload'), {
        method: 'POST',
        body: form,
    });
    return json(res);
}

/**
 * List files, optionally by category.
 * GET /files/?category_id=&user_id=
 */
export async function listFiles({ categoryId, userId } = {}) {
    const params = new URLSearchParams();
    if (categoryId) params.set('category_id', categoryId);
    if (userId) params.set('user_id', userId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(url(`/files/${qs}`));
    return json(res);
}

/**
 * Delete a file.
 * DELETE /files/{file_id}?user_id=
 */
export async function deleteFile(fileId, userId) {
    const params = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const res = await fetch(url(`/files/${fileId}${params}`), { method: 'DELETE' });
    return json(res);
}

// ─── Swarm (run pipeline) ───────────────────────────────────

/**
 * Start a swarm processing job.
 * POST /swarm/run
 * Returns { job_id, status: "QUEUED" }
 */
export async function runSwarm({ fileId, categoryId, userId, userContext }) {
    const body = {
        file_id: fileId,
        category_id: categoryId,
        user_id: userId || null,
    };
    if (userContext) body.user_context = userContext;

    const res = await fetch(url('/swarm/run'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return json(res);
}

// ─── Jobs (polling) ─────────────────────────────────────────

/**
 * Poll job status.
 * GET /jobs/{job_id}?user_id=
 * Returns { job_id, file_id, status, progress_percentage, created_at, started_at, completed_at, error_message }
 */
export async function getJobStatus(jobId, userId) {
    const params = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const res = await fetch(url(`/jobs/${jobId}${params}`));
    return json(res);
}

/**
 * Get job output (only when COMPLETED).
 * GET /jobs/{job_id}/output?user_id=
 */
export async function getJobOutput(jobId, userId) {
    const params = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const res = await fetch(url(`/jobs/${jobId}/output${params}`));
    return json(res);
}

/**
 * Poll a job until it completes or fails.
 * Calls onProgress(status) on each poll.
 * Returns the final job status object.
 */
export async function pollJobUntilDone(jobId, userId, { interval = 3000, onProgress } = {}) {
    while (true) {
        const status = await getJobStatus(jobId, userId);
        if (onProgress) onProgress(status);

        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
            return status;
        }

        await new Promise((r) => setTimeout(r, interval));
    }
}

// ─── Model Cards ────────────────────────────────────────────

/**
 * List all model cards.
 * GET /model-cards
 */
export async function listModelCards(userId) {
    const params = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const res = await fetch(url(`/model-cards${params}`));
    return json(res);
}

/**
 * Get calculation questions.
 * GET /model-cards/calculation-questions
 */
export async function getCalculationQuestions() {
    const res = await fetch(url('/model-cards/calculation-questions'));
    return json(res);
}

/**
 * Save test cases for a category.
 * POST /model-cards/test-cases
 */
export async function saveTestCases({ categoryId, testCases, userId }) {
    const res = await fetch(url('/model-cards/test-cases'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            category_id: categoryId,
            test_cases: testCases,
            user_id: userId || null,
        }),
    });
    return json(res);
}

/**
 * Save calculations for a category.
 * POST /model-cards/calculations
 */
export async function saveCalculations({ categoryId, calculations, userId }) {
    const res = await fetch(url('/model-cards/calculations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            category_id: categoryId,
            calculations,
            user_id: userId || null,
        }),
    });
    return json(res);
}

// ─── Interview Integration ──────────────────────────────────

/**
 * Get interview agent configuration (service discovery).
 * GET /interview/config
 */
export async function getInterviewConfig() {
    const res = await fetch(url('/interview/config'));
    return json(res);
}

/**
 * Check if interview is ready for a category.
 * GET /interview/{category_id}/ready
 */
export async function checkInterviewReady(categoryId, userId) {
    const params = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const res = await fetch(url(`/interview/${categoryId}/ready${params}`));
    return json(res);
}

/**
 * Get combined interview payload (extraction + enrichment).
 * GET /interview/{category_id}/payload
 */
export async function getInterviewPayload(categoryId, userId) {
    const params = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const res = await fetch(url(`/interview/${categoryId}/payload${params}`));
    return json(res);
}

export default {
    listCategories, createCategory, getCategory,
    uploadFile, listFiles, deleteFile,
    runSwarm, getJobStatus, getJobOutput, pollJobUntilDone,
    listModelCards, getCalculationQuestions, saveTestCases, saveCalculations,
    getInterviewConfig, checkInterviewReady, getInterviewPayload,
};
