// Folder-tree algebra for the notes sections. Pure functions over the layout
// tree — no React, no DOM classes, no copy. A section imports what it needs; if
// one ever wants a different nesting model it simply stops importing from here,
// with no effect on the other.
//
// A node is an item leaf { t:'r', id } or a folder { t:'g', id, children:[…] }.
// Folders nest to any depth. The items/groups arrays hold only CONTENT keyed by
// id — the tree alone defines order and nesting.

export const nodeKey = (n) => n.t + ':' + n.id;

// Old flat layout → tree (one-time migration). The old format listed only
// top-level entries and kept each entry's container in item.groupId, with grouped
// entries absent from the layout. Detect it by a group entry with no children
// array, and rebuild each group's children from groupId.
export function toTree(layout, items, groups) {
  const list = layout || [];
  const isOld = list.some((e) => e && e.t === 'g' && !Array.isArray(e.children));
  if (!isOld) return list;
  return list.map((e) =>
    e.t === 'g'
      ? { t: 'g', id: e.id, children: items.filter((r) => (r.groupId ?? null) === e.id).map((r) => ({ t: 'r', id: r.id })) }
      : { t: 'r', id: e.id }
  );
}

// Reconcile a stored tree against the live items/groups: drop nodes whose id no
// longer exists, dedupe, recurse into groups; then prepend brand-new rules and
// append brand-new groups at the top level so nothing created elsewhere is lost.
export function reconcileTree(tree, items, groups) {
  const itemIds = new Set(items.map((x) => x.id));
  const groupIds = new Set(groups.map((g) => g.id));
  const seen = new Set();
  const walk = (nodes) => {
    const out = [];
    for (const n of (nodes || [])) {
      if (!n || !n.id) continue;
      const key = nodeKey(n);
      if (seen.has(key)) continue;
      if (n.t === 'g' && groupIds.has(n.id)) { seen.add(key); out.push({ t: 'g', id: n.id, children: walk(n.children) }); }
      else if (n.t === 'r' && itemIds.has(n.id)) { seen.add(key); out.push({ t: 'r', id: n.id }); }
    }
    return out;
  };
  const pruned = walk(tree);
  const missingItems = items.filter((r) => !seen.has('r:' + r.id)).map((r) => ({ t: 'r', id: r.id }));
  const missingGroups = groups.filter((g) => !seen.has('g:' + g.id)).map((g) => ({ t: 'g', id: g.id, children: [] }));
  return [...missingItems, ...pruned, ...missingGroups];
}

export function sameTree(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((n, i) => b[i] && n.t === b[i].t && n.id === b[i].id &&
    (n.t !== 'g' || sameTree(n.children || [], b[i].children || [])));
}

// ── Pure tree edits (return new arrays) ──────────────────────────────────────
// `key` is a node key like 'g:123'; `containerId` is a group id, or null for the
// top level.
export function findNode(nodes, key) {
  for (const n of (nodes || [])) {
    if (nodeKey(n) === key) return n;
    if (n.t === 'g') { const f = findNode(n.children, key); if (f) return f; }
  }
  return null;
}
// True if `key` is `node` itself or anywhere in its subtree — the guard that
// stops a group being dropped into itself or one of its own descendants.
export function nodeContains(node, key) {
  if (nodeKey(node) === key) return true;
  return node.t === 'g' && (node.children || []).some((c) => nodeContains(c, key));
}
export function removeNode(nodes, key) {
  const out = [];
  for (const n of (nodes || [])) {
    if (nodeKey(n) === key) continue;
    out.push(n.t === 'g' ? { ...n, children: removeNode(n.children, key) } : n);
  }
  return out;
}
export function insertNode(nodes, containerId, index, node) {
  if (containerId == null) {
    const out = (nodes || []).slice();
    out.splice(Math.max(0, Math.min(index, out.length)), 0, node);
    return out;
  }
  return (nodes || []).map((n) => {
    if (n.t !== 'g') return n;
    if (n.id === containerId) {
      const kids = (n.children || []).slice();
      kids.splice(Math.max(0, Math.min(index, kids.length)), 0, node);
      return { ...n, children: kids };
    }
    return { ...n, children: insertNode(n.children, containerId, index, node) };
  });
}
// Delete a group but keep its contents: splice its children into its own place
// one level up (so deleting a folder never loses the rules inside it).
export function dissolveGroup(nodes, gid) {
  const out = [];
  for (const n of (nodes || [])) {
    if (n.t === 'g' && n.id === gid) { out.push(...(n.children || [])); continue; }
    out.push(n.t === 'g' ? { ...n, children: dissolveGroup(n.children, gid) } : n);
  }
  return out;
}
// Every item id anywhere in a subtree (for a folder's count).
export function collectItemIds(nodes, acc = []) {
  for (const n of (nodes || [])) {
    if (n.t === 'r') acc.push(n.id);
    else if (n.t === 'g') collectItemIds(n.children, acc);
  }
  return acc;
}

// Insertion index among a zone's DIRECT child nodes, from pointer Y (skips the
// dragged node so the index matches the container without it). Only direct
// children carry `data-node-key`, so nested groups' cards are ignored here.
export function childDropIndex(zoneEl, y, selfKey) {
  if (!zoneEl) return 0;
  let index = 0;
  for (const c of zoneEl.querySelectorAll(':scope > [data-node-key]')) {
    if (c.getAttribute('data-node-key') === selfKey) continue;
    const rect = c.getBoundingClientRect();
    if (y > rect.top + rect.height / 2) index++; else break;
  }
  return index;
}
