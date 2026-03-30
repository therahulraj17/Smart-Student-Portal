const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: [2000] },
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

messageSchema.index({ roomId: 1, createdAt: -1 });

// Generate a consistent room ID from two user IDs
messageSchema.statics.getRoomId = function (id1, id2) {
  const sorted = [id1.toString(), id2.toString()].sort();
  return sorted.join('_');
};

module.exports = mongoose.model('Message', messageSchema);
