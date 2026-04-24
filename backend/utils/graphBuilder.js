/**
 * Builds the graph from validated edges.
 * 
 * Handles:
 *  - Duplicate edge detection (first occurrence wins)
 *  - Multi-parent resolution (first parent for a child wins, later edges silently dropped)
 *  - Adjacency list construction
 *  - Connected component grouping
 */

function buildGraph(validEdges) {
  const seenEdges = new Set();
  const duplicateEdges = [];

  // Track which parent "owns" each child (first-parent-wins)
  const childToParent = new Map();

  // Adjacency list: parent -> [children]
  const adjacency = new Map();

  // All nodes we've encountered
  const allNodes = new Set();

  for (const { parent, child, raw } of validEdges) {
    const edgeKey = `${parent}->${child}`;

    // Duplicate check
    if (seenEdges.has(edgeKey)) {
      // Only add to duplicateEdges once, regardless of how many repeats
      if (!duplicateEdges.includes(edgeKey)) {
        duplicateEdges.push(edgeKey);
      }
      continue;
    }
    seenEdges.add(edgeKey);

    // Multi-parent check: if this child already has a parent, silently discard
    if (childToParent.has(child)) {
      continue;
    }
    childToParent.set(child, parent);

    // Add to adjacency list
    if (!adjacency.has(parent)) adjacency.set(parent, []);
    adjacency.get(parent).push(child);

    // Track all nodes
    allNodes.add(parent);
    allNodes.add(child);
  }

  // Ensure every node appears in adjacency (even leaf nodes with no children)
  for (const node of allNodes) {
    if (!adjacency.has(node)) adjacency.set(node, []);
  }

  // Find connected components using BFS
  const components = findComponents(allNodes, adjacency, childToParent);

  return { adjacency, childToParent, duplicateEdges, components };
}

/**
 * Groups nodes into connected components.
 * We use an undirected view of the graph for connectivity.
 */
function findComponents(allNodes, adjacency, childToParent) {
  // Build undirected adjacency for component discovery
  const undirected = new Map();
  for (const node of allNodes) {
    if (!undirected.has(node)) undirected.set(node, new Set());
  }

  for (const [parent, children] of adjacency) {
    for (const child of children) {
      undirected.get(parent).add(child);
      undirected.get(child).add(parent);
    }
  }

  const visited = new Set();
  const components = [];

  for (const node of allNodes) {
    if (visited.has(node)) continue;

    // BFS to find all nodes in this component
    const component = [];
    const queue = [node];
    visited.add(node);

    while (queue.length > 0) {
      const current = queue.shift();
      component.push(current);

      for (const neighbor of undirected.get(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push(component.sort());
  }

  return components;
}

module.exports = { buildGraph };
