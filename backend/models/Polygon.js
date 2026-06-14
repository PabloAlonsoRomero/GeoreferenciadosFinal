const mongoose = require('mongoose');

const CoordinateSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const PolygonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: 'general' },
  coordinates: [CoordinateSchema],
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Polygon', PolygonSchema);
