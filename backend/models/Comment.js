const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  pointId: { type: mongoose.Schema.Types.ObjectId, ref: 'Point', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  comment: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', CommentSchema);
