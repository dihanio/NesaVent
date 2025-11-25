const Notification = require('../models/Notification');

// Helper function untuk create notification
const createNotification = async (userId, type, title, message, relatedData = {}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      ...relatedData
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = req.query.unreadOnly === 'true' ? { user: req.user._id, isRead: false } : { user: req.user._id };

    const notifications = await Notification.find(filter)
      .populate('relatedEvent', 'nama tanggalMulai')
      .populate('relatedOrder', 'totalHarga')
      .populate('relatedWithdrawal', 'jumlah')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
    }

    notification.isRead = true;
    notification.readAt = Date.now();
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true, readAt: Date.now() }
    );

    res.json({ message: 'Semua notifikasi ditandai sudah dibaca' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
    }

    res.json({ message: 'Notifikasi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/clear-read
// @access  Private
const clearReadNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({
      user: req.user._id,
      isRead: true
    });

    res.json({ message: 'Notifikasi yang sudah dibaca berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications
};
