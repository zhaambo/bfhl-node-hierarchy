const express = require('express');
const { validateEntries } = require('../utils/validator');
const { buildGraph } = require('../utils/graphBuilder');
const { buildHierarchies } = require('../utils/treeBuilder');
const { generateSummary } = require('../utils/summary');

const router = express.Router();

// --- Update these with your actual details ---
const USER_ID = 'samrakshan_24042004';
const EMAIL_ID = 'samrakshan@college.edu';
const COLLEGE_ROLL_NUMBER = 'RA2211003010000';
// ---

router.post('/', (req, res) => {
  try {
    const { data } = req.body;

    // Basic request validation
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        error: 'Request body must contain a "data" field with an array of strings.'
      });
    }

    // Step 1: Validate each entry
    const { validEdges, invalidEntries } = validateEntries(data);

    // Step 2: Build graph (dedup + multi-parent + components)
    const { adjacency, childToParent, duplicateEdges, components } = buildGraph(validEdges);

    // Step 3: Build hierarchies (tree construction, cycle detection, depth)
    const hierarchies = buildHierarchies(components, adjacency, childToParent);

    // Step 4: Generate summary
    const summary = generateSummary(hierarchies);

    return res.json({
      user_id: USER_ID,
      email_id: EMAIL_ID,
      college_roll_number: COLLEGE_ROLL_NUMBER,
      hierarchies,
      invalid_entries: invalidEntries,
      duplicate_edges: duplicateEdges,
      summary
    });

  } catch (err) {
    console.error('Error processing /bfhl:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
