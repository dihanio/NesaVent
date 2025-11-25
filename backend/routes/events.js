const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect, protectMitra } = require('../middleware/auth');

router.route('/').get(getAllEvents).post(protect, protectMitra, createEvent);
router
  .route('/:id')
  .get(getEventById)
  .put(protect, protectMitra, updateEvent)
  .delete(protect, protectMitra, deleteEvent);

module.exports = router;
