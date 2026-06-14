const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  category: { type: String, default: 'general' },
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Point', PointSchema);
