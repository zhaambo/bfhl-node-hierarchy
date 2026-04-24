/**
 * Generates the summary object from the hierarchies array.
 * 
 * - total_trees: count of non-cyclic hierarchies
 * - total_cycles: count of cyclic hierarchies
 * - largest_tree_root: root of the tree with greatest depth
 *   (tiebreaker: lexicographically smaller root wins)
 */

function generateSummary(hierarchies) {
  let totalTrees = 0;
  let totalCycles = 0;
  let largestTreeRoot = '';
  let maxDepth = 0;

  for (const h of hierarchies) {
    if (h.has_cycle) {
      totalCycles++;
    } else {
      totalTrees++;

      // Track the largest tree (by depth), with lex tiebreaker
      if (
        h.depth > maxDepth ||
        (h.depth === maxDepth && h.root < largestTreeRoot)
      ) {
        maxDepth = h.depth;
        largestTreeRoot = h.root;
      }
    }
  }

  return {
    total_trees: totalTrees,
    total_cycles: totalCycles,
    largest_tree_root: largestTreeRoot
  };
}

module.exports = { generateSummary };
