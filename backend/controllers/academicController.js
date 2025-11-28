const Fakultas = require('../models/Fakultas');
const ProgramStudi = require('../models/ProgramStudi');

// Get all fakultas
exports.getAllFakultas = async (req, res) => {
  try {
    const fakultas = await Fakultas.find().sort({ nama: 1 });
    res.json(fakultas);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fakultas', error: error.message });
  }
};

// Create fakultas
exports.createFakultas = async (req, res) => {
  try {
    const { nama } = req.body;

    const fakultas = new Fakultas({
      nama
    });

    await fakultas.save();
    res.status(201).json(fakultas);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Fakultas dengan nama tersebut sudah ada' });
    } else {
      res.status(500).json({ message: 'Error creating fakultas', error: error.message });
    }
  }
};

// Update fakultas
exports.updateFakultas = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama } = req.body;

    const fakultas = await Fakultas.findByIdAndUpdate(
      id,
      { nama },
      { new: true, runValidators: true }
    );

    if (!fakultas) {
      return res.status(404).json({ message: 'Fakultas tidak ditemukan' });
    }

    res.json(fakultas);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Fakultas dengan nama tersebut sudah ada' });
    } else {
      res.status(500).json({ message: 'Error updating fakultas', error: error.message });
    }
  }
};

// Delete fakultas
exports.deleteFakultas = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if fakultas is used by any program studi
    const programStudiCount = await ProgramStudi.countDocuments({ fakultas: id });
    if (programStudiCount > 0) {
      return res.status(400).json({
        message: 'Fakultas tidak dapat dihapus karena masih digunakan oleh program studi'
      });
    }

    const fakultas = await Fakultas.findByIdAndDelete(id);

    if (!fakultas) {
      return res.status(404).json({ message: 'Fakultas tidak ditemukan' });
    }

    res.json({ message: 'Fakultas berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting fakultas', error: error.message });
  }
};

// Get all program studi
exports.getAllProgramStudi = async (req, res) => {
  try {
    const programStudi = await ProgramStudi.find()
      .populate('fakultas', 'nama')
      .sort({ nama: 1 });
    res.json(programStudi);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching program studi', error: error.message });
  }
};

// Create program studi
exports.createProgramStudi = async (req, res) => {
  try {
    const { nama, fakultas } = req.body;

    const programStudi = new ProgramStudi({
      nama,
      fakultas
    });

    await programStudi.save();
    await programStudi.populate('fakultas', 'nama');
    res.status(201).json(programStudi);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Program studi dengan nama tersebut sudah ada di fakultas ini' });
    } else {
      res.status(500).json({ message: 'Error creating program studi', error: error.message });
    }
  }
};

// Update program studi
exports.updateProgramStudi = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, fakultas } = req.body;

    const programStudi = await ProgramStudi.findByIdAndUpdate(
      id,
      { nama, fakultas },
      { new: true, runValidators: true }
    ).populate('fakultas', 'nama');

    if (!programStudi) {
      return res.status(404).json({ message: 'Program studi tidak ditemukan' });
    }

    res.json(programStudi);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Program studi dengan nama tersebut sudah ada di fakultas ini' });
    } else {
      res.status(500).json({ message: 'Error updating program studi', error: error.message });
    }
  }
};

// Delete program studi
exports.deleteProgramStudi = async (req, res) => {
  try {
    const { id } = req.params;

    const programStudi = await ProgramStudi.findByIdAndDelete(id);

    if (!programStudi) {
      return res.status(404).json({ message: 'Program studi tidak ditemukan' });
    }

    res.json({ message: 'Program studi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting program studi', error: error.message });
  }
};