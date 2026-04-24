/**
 * Validates raw edge strings from the input array.
 * 
 * Valid format: exactly "X->Y" where X and Y are single uppercase letters (A-Z),
 * and X !== Y (no self-loops). Whitespace is trimmed before validation.
 */

const EDGE_PATTERN = /^([A-Z])->([A-Z])$/;

function validateEntries(data) {
  const validEdges = [];
  const invalidEntries = [];

  for (const raw of data) {
    // The spec says entries can be anything — numbers, objects, etc.
    if (typeof raw !== 'string') {
      invalidEntries.push(String(raw));
      continue;
    }

    const trimmed = raw.trim();

    // Empty strings are invalid
    if (trimmed === '') {
      invalidEntries.push(raw);
      continue;
    }

    const match = trimmed.match(EDGE_PATTERN);

    if (!match) {
      invalidEntries.push(trimmed);
      continue;
    }

    const parent = match[1];
    const child = match[2];

    // Self-loops are explicitly invalid per the spec
    if (parent === child) {
      invalidEntries.push(trimmed);
      continue;
    }

    validEdges.push({ parent, child, raw: trimmed });
  }

  return { validEdges, invalidEntries };
}

module.exports = { validateEntries };
