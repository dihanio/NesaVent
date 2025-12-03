const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByPartnerId,
} = require('../controllers/eventController');
const { protect, protectMitra } = require('../middleware/auth');
const { eventCreationLimiter } = require('../utils/rateLimiter');
const { validateEventCreation, handleValidationErrors } = require('../utils/validators');

// Public routes
router.get('/', getAllEvents);
router.get('/partner/:partnerSlug', getEventsByPartnerId);
router.get('/:slug', getEventById);

// Protected routes - Mitra only
router.post('/', protect, protectMitra, eventCreationLimiter, validateEventCreation, handleValidationErrors, createEvent);
router.put('/:slug', protect, protectMitra, validateEventCreation, handleValidationErrors, updateEvent);
router.delete('/:slug', protect, protectMitra, deleteEvent);

module.exports = router;
