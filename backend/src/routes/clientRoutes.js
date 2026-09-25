const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientTimeline,
} = require('../controllers/clientController');

const router = express.Router();

router.get('/', asyncHandler(listClients));
router.post('/', asyncHandler(createClient));
router.get('/:id', asyncHandler(getClient));
router.get('/:id/timeline', asyncHandler(getClientTimeline));
router.patch('/:id', asyncHandler(updateClient));
router.delete('/:id', asyncHandler(deleteClient));

module.exports = router;
