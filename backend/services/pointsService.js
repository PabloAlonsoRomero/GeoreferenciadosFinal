const Point = require('../models/Point');

class PointsService {
  /**
   * Obtiene todos los puntos con un filtro opcional.
   */
  async find(query = { active: true }) {
    return await Point.find(query);
  }

  /**
   * Obtiene un punto por su ID.
   */
  async findById(id) {
    const point = await Point.findById(id);
    if (!point) throw new Error('Ubicación no encontrada');
    return point;
  }

  /**
   * Crea un nuevo punto turístico.
   */
  async create(data) {
    const newPoint = new Point({
      name: data.name,
      description: data.description,
      lat: data.lat,
      lng: data.lng,
      category: data.category || 'general',
      active: data.active !== false
    });
    return await newPoint.save();
  }

  /**
   * Actualiza un punto turístico existente.
   */
  async update(id, changes) {
    const updatedPoint = await Point.findByIdAndUpdate(
      id,
      { $set: changes },
      { new: true }
    );
    if (!updatedPoint) throw new Error('Ubicación no encontrada para actualizar');
    return updatedPoint;
  }

  /**
   * Realiza un borrado lógico de la ubicación.
   */
  async delete(id) {
    const deletedPoint = await Point.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true }
    );
    if (!deletedPoint) throw new Error('Ubicación no encontrada para eliminar');
    return deletedPoint;
  }
}

module.exports = new PointsService();
