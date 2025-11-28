const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @desc    Get all mitra
// @route   GET /api/mitra
// @access  Public
const getAllMitra = async (req, res) => {
    try {
        const { search } = req.query;

        // Build query
        const query = { role: 'mitra' };

        // Add search filter if provided
        if (search) {
            query.$or = [
                { nama: { $regex: search, $options: 'i' } },
                { organisasi: { $regex: search, $options: 'i' } }
            ];
        }

        // Get mitra users with only public fields
        const mitras = await User.find(query)
            .select('nama organisasi avatar slug')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: mitras.length,
            data: mitras
        });
    } catch (error) {
        console.error('Error fetching mitra:', error);
        res.status(500).json({ message: error.message });
    }
};

router.get('/', getAllMitra);

module.exports = router;
