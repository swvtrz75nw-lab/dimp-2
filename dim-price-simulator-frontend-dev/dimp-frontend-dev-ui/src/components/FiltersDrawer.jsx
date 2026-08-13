import React, { useState, useRef, useEffect } from 'react';
import './FiltersDrawer.css';

export const FILTER_TABS = [
  {
    key: 'category',
    label: 'Category (L2 / L3)',
    note: 'Check an L2 to include every sub-category beneath it, or expand it to pick specific L3s.',
    leafNoun: 'sub-categories',
  },
  {
    key: 'market',
    label: 'PMI Market (Region / Cluster / Country)',
    note: 'PMI market hierarchy: Region → Cluster → Country. Checking a Region or Cluster selects every country beneath it.',
    leafNoun: 'countries',
  },
  {
    key: 'vendor',
    label: 'Sievo Vendor Country',
    note: 'Sourcing hierarchy from Sievo vendor data: Vendor Region → Vendor Country (no cluster level). Narrows spend by where it was sourced from, independent of the PMI market above.',
    leafNoun: 'vendor countries',
  },
];

// A tree node is { label: string, children?: node[] }. Filters are stored as
// a Set of selected LEAF labels only (finest grain) - checking a branch just
// adds/removes every leaf beneath it, so a branch's full/partial/empty state
// is always derived, never stored separately.
export function computeLeaves(node) {
  if (!node.children || node.children.length === 0) return [node.label];
  return node.children.flatMap(computeLeaves);
}

export function flattenTree(tree) {
  const out = [];
  (function walk(n) {
    out.push(n);
    (n.children || []).forEach(walk);
  })({ children: tree });
  out.shift();
  return out;
}

export function buildTwoLevelTree(parents, childrenWithParent) {
  const nodes = parents.map((name) => ({ label: name, children: [] }));
  childrenWithParent.forEach(([name, parentId]) => nodes[parentId].children.push({ label: name }));
  return nodes;
}

function selState(set, items) {
  if (!items.length) return 'none';
  const n = items.filter((x) => set.has(x)).length;
  if (n === 0) return 'none';
  if (n === items.length) return 'full';
  return 'partial';
}

function toggleGroupSet(set, items) {
  const next = new Set(set);
  const allIn = items.length > 0 && items.every((x) => next.has(x));
  if (allIn) items.forEach((x) => next.delete(x));
  else items.forEach((x) => next.add(x));
  return next;
}

function nodeMatchesSearch(node, term) {
  if (!term) return true;
  if (node.label.toLowerCase().includes(term)) return true;
  return (node.children || []).some((c) => nodeMatchesSearch(c, term));
}

export function describeSelection(set, flatNodes, noun) {
  if (set.size === 0) return null;
  let best = null;
  flatNodes.forEach((n) => {
    const leaves = computeLeaves(n);
    if (leaves.length === set.size && leaves.every((l) => set.has(l))) {
      if (!best || leaves.length > best.leaves.length) best = { label: n.label, leaves };
    }
  });
  if (best) return best.label;
  if (set.size === 1) return Array.from(set)[0];
  return `${set.size} ${noun} selected`;
}

function TreeNode({ node, depth, selectedSet, term, expanded, onToggleExpand, onToggleSelect }) {
  const checkboxRef = useRef(null);
  const leaves = computeLeaves(node);
  const st = selState(selectedSet, leaves);
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isExpanded = term ? true : expanded.has(node.label);

  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = st === 'partial';
  }, [st]);

  if (!nodeMatchesSearch(node, term)) return null;

  return (
    <>
      <div className="tree-row" style={{ paddingLeft: depth * 16 }}>
        {hasChildren ? (
          <button
            type="button"
            className="tree-toggle"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.label);
            }}
          >
            {isExpanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="tree-toggle-spacer" />
        )}
        <input
          ref={checkboxRef}
          type="checkbox"
          className="tree-checkbox"
          checked={st === 'full'}
          onChange={() => onToggleSelect(leaves)}
        />
        <span className="tree-label" onClick={() => onToggleSelect(leaves)}>
          {node.label}
        </span>
        {hasChildren && (
          <span className="tree-count">
            {leaves.filter((l) => selectedSet.has(l)).length}/{leaves.length}
          </span>
        )}
      </div>
      {hasChildren &&
        isExpanded &&
        node.children.map((child) => (
          <TreeNode
            key={child.label}
            node={child}
            depth={depth + 1}
            selectedSet={selectedSet}
            term={term}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            onToggleSelect={onToggleSelect}
          />
        ))}
    </>
  );
}

export function TreeSection({ tree, selectedSet, onChange, searchTerm, onSearchChange, expanded, onToggleExpand, leafNoun }) {
  const allLeaves = tree.flatMap(computeLeaves);
  const selectedCount = allLeaves.filter((l) => selectedSet.has(l)).length;
  const term = searchTerm.trim().toLowerCase();

  return (
    <div>
      <div className="tree-search">
        <input
          type="text"
          placeholder={`Search ${leafNoun}…`}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="tree-actions">
        <span className="tree-count-summary">
          {selectedCount} of {allLeaves.length} {leafNoun} selected
        </span>
        <button type="button" onClick={() => onChange(new Set([...selectedSet, ...allLeaves]))}>
          Select all
        </button>
        <button type="button" onClick={() => onChange(new Set())}>
          Clear
        </button>
      </div>
      <div className="tree">
        {tree.map((node) => (
          <TreeNode
            key={node.label}
            node={node}
            depth={0}
            selectedSet={selectedSet}
            term={term}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            onToggleSelect={(leaves) => onChange(toggleGroupSet(selectedSet, leaves))}
          />
        ))}
      </div>
    </div>
  );
}

// Controlled component: `isOpen`/`onClose` drive the slide-in panel, and each
// hierarchy's Set + setter is passed in so the parent (which also drives
// charts/tables/KPIs off the same Sets) stays the single source of truth.
export default function FiltersDrawer({
  isOpen,
  onClose,
  categoryTree,
  marketTree,
  vendorTree,
  catFilter,
  onCatFilterChange,
  mktFilter,
  onMktFilterChange,
  vendorFilter,
  onVendorFilterChange,
}) {
  const [filterTab, setFilterTab] = useState('category');
  const [treeSearch, setTreeSearch] = useState({ category: '', market: '', vendor: '' });
  const [treeExpanded, setTreeExpanded] = useState({
    category: new Set(),
    market: new Set(),
    vendor: new Set(),
  });

  const toggleExpand = (tabKey, label) => {
    setTreeExpanded((prev) => {
      const next = new Set(prev[tabKey]);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return { ...prev, [tabKey]: next };
    });
  };

  const tabConfig = {
    category: { tree: categoryTree, set: catFilter, onChange: onCatFilterChange },
    market: { tree: marketTree, set: mktFilter, onChange: onMktFilterChange },
    vendor: { tree: vendorTree, set: vendorFilter, onChange: onVendorFilterChange },
  };

  const active = FILTER_TABS.find((t) => t.key === filterTab);
  const activeConfig = tabConfig[filterTab];

  return (
    <>
      <div className={`drawer-overlay${isOpen ? ' open' : ''}`} onClick={onClose} />
      <aside className={`drawer${isOpen ? ' open' : ''}`}>
        <div className="drawer-header">
          <h2>Filters</h2>
          <button type="button" className="drawer-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="drawer-body">
          <div className="filters-subtabs">
            {FILTER_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`filters-subtab${filterTab === t.key ? ' active' : ''}`}
                onClick={() => setFilterTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="filters-panel-note">{active.note}</div>
          <TreeSection
            tree={activeConfig.tree}
            selectedSet={activeConfig.set}
            onChange={activeConfig.onChange}
            searchTerm={treeSearch[filterTab]}
            onSearchChange={(v) => setTreeSearch((prev) => ({ ...prev, [filterTab]: v }))}
            expanded={treeExpanded[filterTab]}
            onToggleExpand={(label) => toggleExpand(filterTab, label)}
            leafNoun={active.leafNoun}
          />
        </div>
      </aside>
    </>
  );
}

export function FiltersButton({ isOpen, onClick }) {
  return (
    <button type="button" className={`filters-toggle-btn${isOpen ? ' open' : ''}`} onClick={onClick}>
      Filters
    </button>
  );
}

export function ResetFiltersLink({ onReset }) {
  return (
    <button type="button" className="reset-link" onClick={onReset}>
      Reset all filters
    </button>
  );
}
