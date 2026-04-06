const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    // Make sure user owns notification
    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: notification });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
