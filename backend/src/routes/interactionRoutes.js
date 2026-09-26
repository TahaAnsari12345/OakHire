const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { interactionSchema, interactionUpdateSchema } = require('../validators/interactionSchemas');
const { listInteractions, createInteraction, updateInteraction, deleteInteraction } = require('../controllers/interactionController');

const router = express.Router();

router.get('/', asyncHandler(listInteractions));
router.post('/', validate(interactionSchema), asyncHandler(createInteraction));
router.put('/:id', validate(interactionUpdateSchema), asyncHandler(updateInteraction));
router.delete('/:id', asyncHandler(deleteInteraction));

module.exports = router;
