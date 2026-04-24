// --- Configuration ---
// When deployed, the API is on the same origin. For local dev, adjust if needed.
const API_URL = "https://bfhl-api-2mi8.onrender.com/bfhl";

// --- DOM Elements ---
const nodeInput = document.getElementById('nodeInput');
const submitBtn = document.getElementById('submitBtn');
const spinner = document.getElementById('spinner');
const errorBanner = document.getElementById('errorBanner');
const resultsDiv = document.getElementById('results');

/**
 * Parse the textarea input into an array of strings.
 * Supports both JSON array format and comma/newline separated values.
 */
function parseInput(raw) {
  const trimmed = raw.trim();

  // Try JSON parse first
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (e) {
      // Fall through to comma/newline parsing
    }
  }

  // Split by commas or newlines, filter empties
  return trimmed
    .split(/[,\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Main submit handler.
 */
async function handleSubmit() {
  const raw = nodeInput.value;

  if (!raw.trim()) {
    showError('Please enter some edge definitions.');
    return;
  }

  const data = parseInput(raw);

  // UI: loading state
  hideError();
  hideResults();
  submitBtn.disabled = true;
  spinner.style.display = 'block';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with ${response.status}`);
    }

    const result = await response.json();
    renderResults(result);

  } catch (err) {
    showError(err.message || 'Failed to connect to the API. Is the server running?');
  } finally {
    submitBtn.disabled = false;
    spinner.style.display = 'none';
  }
}

/**
 * Render the full API response.
 */
function renderResults(data) {
  renderSummary(data.summary);
  renderHierarchies(data.hierarchies);
  renderInvalidEntries(data.invalid_entries);
  renderDuplicateEdges(data.duplicate_edges);

  resultsDiv.classList.add('visible');
}

// --- Summary ---
function renderSummary(summary) {
  const grid = document.getElementById('summaryGrid');
  grid.innerHTML = `
    <div class="summary-stat">
      <div class="value">${summary.total_trees}</div>
      <div class="label">Valid Trees</div>
    </div>
    <div class="summary-stat">
      <div class="value">${summary.total_cycles}</div>
      <div class="label">Cycles</div>
    </div>
    <div class="summary-stat">
      <div class="value">${summary.largest_tree_root || '—'}</div>
      <div class="label">Largest Tree Root</div>
    </div>
  `;
}

// --- Hierarchies ---
function renderHierarchies(hierarchies) {
  const container = document.getElementById('hierarchiesContainer');
  const countBadge = document.getElementById('hierarchyCount');
  countBadge.textContent = `${hierarchies.length} group${hierarchies.length !== 1 ? 's' : ''}`;

  if (hierarchies.length === 0) {
    container.innerHTML = '<div class="empty-state">No hierarchies to display.</div>';
    return;
  }

  container.innerHTML = hierarchies.map((h, i) => {
    const isCycle = h.has_cycle === true;
    const badgeClass = isCycle ? 'badge-cycle' : 'badge-success';
    const badgeText = isCycle ? 'Cycle' : `Depth: ${h.depth}`;

    let treeHTML;
    if (isCycle) {
      treeHTML = '<div class="empty-state" style="color: var(--cycle);">⟳ Cycle detected — tree cannot be constructed.</div>';
    } else {
      treeHTML = `<ul class="tree-node">${buildTreeHTML(h.tree)}</ul>`;
    }

    return `
      <div class="tree-container">
        <div class="tree-meta">
          <span>Root: <strong>${h.root}</strong></span>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
        ${treeHTML}
      </div>
    `;
  }).join('');
}

/**
 * Recursively build HTML for a nested tree object.
 * e.g. { "A": { "B": { "D": {} }, "C": {} } }
 */
function buildTreeHTML(obj) {
  const keys = Object.keys(obj);
  if (keys.length === 0) return '';

  return keys.map(key => {
    const children = obj[key];
    const hasChildren = Object.keys(children).length > 0;
    const childHTML = hasChildren ? `<ul class="tree-node">${buildTreeHTML(children)}</ul>` : '';

    return `<li><span class="node-label">${key}</span>${childHTML}</li>`;
  }).join('');
}

// --- Invalid Entries ---
function renderInvalidEntries(entries) {
  const container = document.getElementById('invalidContainer');
  const countBadge = document.getElementById('invalidCount');
  countBadge.textContent = entries.length;

  if (entries.length === 0) {
    container.innerHTML = '<div class="empty-state">No invalid entries.</div>';
    document.getElementById('invalidCard').style.display = 'none';
    return;
  }

  document.getElementById('invalidCard').style.display = 'block';
  container.innerHTML = `
    <div class="tag-list">
      ${entries.map(e => `<span class="tag tag-invalid">${escapeHTML(e)}</span>`).join('')}
    </div>
  `;
}

// --- Duplicate Edges ---
function renderDuplicateEdges(edges) {
  const container = document.getElementById('duplicateContainer');
  const countBadge = document.getElementById('duplicateCount');
  countBadge.textContent = edges.length;

  if (edges.length === 0) {
    container.innerHTML = '<div class="empty-state">No duplicate edges.</div>';
    document.getElementById('duplicateCard').style.display = 'none';
    return;
  }

  document.getElementById('duplicateCard').style.display = 'block';
  container.innerHTML = `
    <div class="tag-list">
      ${edges.map(e => `<span class="tag tag-duplicate">${escapeHTML(e)}</span>`).join('')}
    </div>
  `;
}

// --- Utilities ---
function showError(msg) {
  errorBanner.textContent = msg;
  errorBanner.classList.add('visible');
}

function hideError() {
  errorBanner.classList.remove('visible');
}

function hideResults() {
  resultsDiv.classList.remove('visible');
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Load the example from the problem statement into the textarea.
 */
function loadExample() {
  nodeInput.value = `A->B, A->C, B->D, C->E, E->F,
X->Y, Y->Z, Z->X,
P->Q, Q->R,
G->H, G->H, G->I,
hello, 1->2, A->`;
}

function clearAll() {
  nodeInput.value = '';
  hideError();
  hideResults();
}

// Allow Ctrl+Enter to submit
nodeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    handleSubmit();
  }
});
