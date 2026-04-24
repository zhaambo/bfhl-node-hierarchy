/**
 * For each connected component, builds the hierarchy object:
 *  - Identifies the root node
 *  - Detects cycles via DFS (visited + recursion stack)
 *  - Builds nested tree JSON for acyclic components
 *  - Calculates depth (node count on longest root-to-leaf path)
 */

/**
 * Processes all components and returns an array of hierarchy objects.
 */
function buildHierarchies(components, adjacency, childToParent) {
  const hierarchies = [];

  for (const component of components) {
    const hierarchy = processComponent(component, adjacency, childToParent);
    hierarchies.push(hierarchy);
  }

  return hierarchies;
}

/**
 * Process a single connected component.
 */
function processComponent(component, adjacency, childToParent) {
  // A root is a node that never appears as a child in any valid edge
  const root = findRoot(component, childToParent);

  // Check for cycles using DFS with recursion stack
  const hasCycle = detectCycle(component, adjacency);

  if (hasCycle) {
    return {
      root,
      tree: {},
      has_cycle: true
    };
  }

  // Build the nested tree structure
  const tree = buildNestedTree(root, adjacency);

  // Calculate depth (number of nodes on longest root-to-leaf path)
  const depth = calculateDepth(root, adjacency);

  return { root, tree, depth };
}

/**
 * Find the root of a component.
 * Root = node that doesn't appear as anyone's child.
 * If no such node exists (pure cycle), use lexicographically smallest.
 */
function findRoot(component, childToParent) {
  const roots = component.filter(node => !childToParent.has(node));

  if (roots.length > 0) {
    // If multiple roots in same component (shouldn't happen with valid tree),
    // pick lex smallest
    return roots.sort()[0];
  }

  // Pure cycle — all nodes are children. Use lex smallest.
  return component.sort()[0];
}

/**
 * DFS-based cycle detection using visited set + recursion stack.
 * Classic algorithm: if we hit a node that's in the current recursion stack,
 * we've found a back edge → cycle.
 */
function detectCycle(component, adjacency) {
  const visited = new Set();
  const recStack = new Set();

  function dfs(node) {
    visited.add(node);
    recStack.add(node);

    const children = adjacency.get(node) || [];
    for (const child of children) {
      if (!visited.has(child)) {
        if (dfs(child)) return true;
      } else if (recStack.has(child)) {
        return true; // Back edge found → cycle
      }
    }

    recStack.delete(node);
    return false;
  }

  // Run DFS from every unvisited node in this component
  for (const node of component) {
    if (!visited.has(node)) {
      if (dfs(node)) return true;
    }
  }

  return false;
}

/**
 * Recursively builds the nested JSON tree.
 * Example: A->B, A->C, B->D produces { "A": { "B": { "D": {} }, "C": {} } }
 */
function buildNestedTree(root, adjacency) {
  const result = {};
  const children = adjacency.get(root) || [];

  const childObj = {};
  for (const child of children) {
    const subtree = buildNestedTree(child, adjacency);
    Object.assign(childObj, subtree);
  }

  result[root] = childObj;
  return result;
}

/**
 * Depth = number of nodes on the longest root-to-leaf path.
 * A single node with no children has depth 1.
 */
function calculateDepth(root, adjacency) {
  const children = adjacency.get(root) || [];

  if (children.length === 0) return 1;

  let maxChildDepth = 0;
  for (const child of children) {
    maxChildDepth = Math.max(maxChildDepth, calculateDepth(child, adjacency));
  }

  return 1 + maxChildDepth;
}

module.exports = { buildHierarchies };
