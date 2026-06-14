const Comment = require('../models/Comment');

class CommentsService {
  /**
   * Obtiene todos los comentarios asociados a un punto turístico específico.
   */
  async findByPoint(pointId) {
    return await Comment.find({ pointId }).sort({ date: -1 });
  }

  /**
   * Crea un nuevo comentario.
   */
  async create(userId, email, data) {
    const newComment = new Comment({
      pointId: data.pointId,
      userId,
      email,
      comment: data.comment,
      rating: data.rating || 5
    });
    return await newComment.save();
  }

  /**
   * Actualiza un comentario (solo permitido al autor).
   */
  async update(id, userId, data) {
    const comment = await Comment.findById(id);
    if (!comment) throw new Error('Comentario no encontrado');
    
    // Validar autoría
    if (comment.userId.toString() !== userId.toString()) {
      throw new Error('No tienes permisos para modificar este comentario');
    }

    if (data.comment !== undefined) comment.comment = data.comment;
    if (data.rating !== undefined) comment.rating = data.rating;
    
    return await comment.save();
  }

  /**
   * Elimina un comentario (solo permitido al autor).
   */
  async delete(id, userId) {
    const comment = await Comment.findById(id);
    if (!comment) throw new Error('Comentario no encontrado');

    // Validar autoría
    if (comment.userId.toString() !== userId.toString()) {
      throw new Error('No tienes permisos para eliminar este comentario');
    }
    return await Comment.findByIdAndDelete(id);
  }

  /**
   * Obtiene todos los comentarios registrados en el sistema, populando los datos del punto turístico.
   */
  async getAll() {
    return await Comment.find({}).populate('pointId', 'name').sort({ date: -1 });
  }

  /**
   * Elimina un comentario de forma directa (para administradores).
   */
  async deleteForce(id) {
    return await Comment.findByIdAndDelete(id);
  }
}

module.exports = new CommentsService();
