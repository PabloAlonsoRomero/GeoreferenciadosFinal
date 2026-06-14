const Polygon = require('../models/Polygon');

class PolygonsService {
  /**
   * Obtiene todos los polígonos con un filtro opcional.
   */
  async find(query = { active: true }) {
    return await Polygon.find(query);
  }

  /**
   * Obtiene un polígono por ID.
   */
  async findById(id) {
    const polygon = await Polygon.findById(id);
    if (!polygon) throw new Error('Zona no encontrada');
    return polygon;
  }

  /**
   * Crea un nuevo polígono.
   */
  async create(data) {
    const newPolygon = new Polygon({
      name: data.name,
      category: data.category || 'general',
      coordinates: data.coordinates,
      active: data.active !== false
    });
    return await newPolygon.save();
  }

  /**
   * Actualiza un polígono.
   */
  async update(id, changes) {
    const updatedPolygon = await Polygon.findByIdAndUpdate(
      id,
      { $set: changes },
      { new: true }
    );
    if (!updatedPolygon) throw new Error('Zona no encontrada para actualizar');
    return updatedPolygon;
  }

  /**
   * Borrado lógico del polígono.
   */
  async delete(id) {
    const deletedPolygon = await Polygon.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true }
    );
    if (!deletedPolygon) throw new Error('Zona no encontrada para eliminar');
    return deletedPolygon;
  }
}

module.exports = new PolygonsService();
