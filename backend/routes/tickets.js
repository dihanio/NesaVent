const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { protect } = require('../middleware/auth');

// @desc    Get tiket user
// @route   GET /api/tickets/my-tickets
// @access  Private
router.get('/my-tickets', protect, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id })
      .populate('event')
      .populate('order')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get detail tiket
// @route   GET /api/tickets/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('event')
      .populate('user', 'nama email');

    if (ticket) {
      // Cek apakah tiket milik user yang login
      if (ticket.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Tidak memiliki akses ke tiket ini' });
      }

      res.json(ticket);
    } else {
      res.status(404).json({ message: 'Tiket tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Validasi tiket (untuk organizer/scanner)
// @route   PUT /api/tickets/:id/validate
// @access  Private
router.put('/:id/validate', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (ticket) {
      if (ticket.status === 'terpakai') {
        return res.status(400).json({ message: 'Tiket sudah pernah digunakan' });
      }

      ticket.status = 'terpakai';
      ticket.divalidasiPada = Date.now();

      const updatedTicket = await ticket.save();
      res.json(updatedTicket);
    } else {
      res.status(404).json({ message: 'Tiket tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
