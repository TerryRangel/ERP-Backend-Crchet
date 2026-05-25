import { suppliersService } from './suppliers.service.js';
import { logAuditEvent } from '../../utils/audit.js'; 

export class SuppliersController {
  async list(req, res) {
    const result = await suppliersService.list(req.query);
    return res.status(200).json(result);
  }

  async getById(req, res) {
    const supplier = await suppliersService.getById(req.params.id);
    return res.status(200).json({ item: supplier });
  }

  async create(req, res) {
    const supplier = await suppliersService.create(req.body, req.user);

    // 2. REGISTRO DE AUDITORÍA: CREAR
    try {
      await logAuditEvent({
        action: 'CREAR',
        resource: 'Proveedores',
        resourceId: supplier.id || supplier._id || '',
        details: { mensaje: `Se registró un nuevo proveedor: ${req.body.nombre}` },
        currentUser: req.user
      });
    } catch (error) {
      console.error('Error guardando auditoría:', error);
    }

    return res.status(201).json({
      message: 'Proveedor creado correctamente',
      item: supplier
    });
  }

  async update(req, res) {
    const supplier = await suppliersService.update(req.params.id, req.body, req.user);

    // 3. REGISTRO DE AUDITORÍA: ACTUALIZAR
    try {
      await logAuditEvent({
        action: 'ACTUALIZAR',
        resource: 'Proveedores',
        resourceId: req.params.id,
        details: { mensaje: `Se actualizaron los datos del proveedor: ${req.body.nombre || req.params.id}` },
        currentUser: req.user
      });
    } catch (error) {
      console.error('Error guardando auditoría:', error);
    }

    return res.status(200).json({
      message: 'Proveedor actualizado correctamente',
      item: supplier
    });
  }

  async toggleActive(req, res) {
    const supplier = await suppliersService.toggleActive(req.params.id, req.body.activo, req.user);

    // 4. REGISTRO DE AUDITORÍA: CAMBIO DE ESTATUS
    try {
      const estado = req.body.activo ? 'activó' : 'inactivó';
      await logAuditEvent({
        action: 'ACTUALIZAR',
        resource: 'Proveedores',
        resourceId: req.params.id,
        details: { mensaje: `Se ${estado} el proveedor con ID: ${req.params.id}` },
        currentUser: req.user
      });
    } catch (error) {
      console.error('Error guardando auditoría:', error);
    }

    return res.status(200).json({
      message: 'Estado del proveedor actualizado correctamente',
      item: supplier
    });
  }

  async remove(req, res) {
    await suppliersService.remove(req.params.id, req.user);

    // 5. REGISTRO DE AUDITORÍA: ELIMINAR
    try {
      await logAuditEvent({
        action: 'ELIMINAR',
        resource: 'Proveedores',
        resourceId: req.params.id,
        details: { mensaje: `Se eliminó el proveedor con ID: ${req.params.id}` },
        currentUser: req.user
      });
    } catch (error) {
      console.error('Error guardando auditoría:', error);
    }

    return res.status(200).json({
      message: 'Proveedor eliminado correctamente'
    });
  }
}

export const suppliersController = new SuppliersController();