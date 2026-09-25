const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const {
  listCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getCandidateTimeline,
} = require('../controllers/candidateController');

const router = express.Router();

router.get('/', asyncHandler(listCandidates));
router.post('/', asyncHandler(createCandidate));
router.get('/:id', asyncHandler(getCandidate));
router.get('/:id/timeline', asyncHandler(getCandidateTimeline));
router.patch('/:id', asyncHandler(updateCandidate));
router.delete('/:id', asyncHandler(deleteCandidate));

module.exports = router;
