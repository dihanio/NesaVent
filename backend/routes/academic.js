const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const { protect, protectAdmin } = require('../middleware/auth');

// Public routes - anyone can view fakultas and program studi
router.get('/fakultas', academicController.getAllFakultas);
router.get('/program-studi', academicController.getAllProgramStudi);

// Admin-only routes for managing data
router.use(protect);
router.use(protectAdmin);

// Fakultas management routes
router.post('/fakultas', academicController.createFakultas);
router.put('/fakultas/:id', academicController.updateFakultas);
router.delete('/fakultas/:id', academicController.deleteFakultas);

// Program Studi management routes
router.post('/program-studi', academicController.createProgramStudi);
router.put('/program-studi/:id', academicController.updateProgramStudi);
router.delete('/program-studi/:id', academicController.deleteProgramStudi);

module.exports = router;