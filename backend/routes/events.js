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

router.route('/').get(getAllEvents).post(protect, protectMitra, createEvent);
router
  .route('/:slug')
  .get(getEventById)
  .put(protect, protectMitra, updateEvent)
  .delete(protect, protectMitra, deleteEvent);
router.route('/partner/:partnerSlug').get(getEventsByPartnerId);

module.exports = router;
