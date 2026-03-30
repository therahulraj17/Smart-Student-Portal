/**
 * Basic plagiarism checker using TF-IDF and Cosine Similarity
 * For production, consider integrating a dedicated API like Copyleaks
 */

/**
 * Tokenize and normalize text
 */
const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);
};

/**
 * Build term frequency map
 */
const buildTF = (tokens) => {
  const tf = {};
  tokens.forEach((token) => {
    tf[token] = (tf[token] || 0) + 1;
  });
  return tf;
};

/**
 * Compute cosine similarity between two TF vectors
 */
const cosineSimilarity = (tf1, tf2) => {
  const allTerms = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  allTerms.forEach((term) => {
    const v1 = tf1[term] || 0;
    const v2 = tf2[term] || 0;
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  });

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
};

/**
 * Check similarity between two text documents
 * Returns similarity percentage (0-100)
 */
const checkSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;

  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const tf1 = buildTF(tokens1);
  const tf2 = buildTF(tokens2);

  const similarity = cosineSimilarity(tf1, tf2);
  return Math.round(similarity * 100);
};

/**
 * Compare one submission against many others
 * Returns array of { submissionId, similarity, studentName }
 */
const compareSubmissions = (targetText, otherSubmissions) => {
  return otherSubmissions
    .map((sub) => ({
      submissionId: sub._id,
      studentName: sub.studentId?.name || 'Unknown',
      similarity: checkSimilarity(targetText, sub.textContent || ''),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .filter((r) => r.similarity > 20); // Only flag > 20% similarity
};

/**
 * Get plagiarism risk level
 */
const getRiskLevel = (similarity) => {
  if (similarity >= 80) return { level: 'high', label: 'High Risk', color: 'red' };
  if (similarity >= 50) return { level: 'medium', label: 'Medium Risk', color: 'orange' };
  if (similarity >= 20) return { level: 'low', label: 'Low Risk', color: 'yellow' };
  return { level: 'none', label: 'Original', color: 'green' };
};

module.exports = { checkSimilarity, compareSubmissions, getRiskLevel };
