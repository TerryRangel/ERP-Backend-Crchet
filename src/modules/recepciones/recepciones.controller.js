import { recepcionesService } from './recepciones.service.js'

export class RecepcionesController {
  async list(req, res) {
    const result = await recepcionesService.list(req.query)
    return res.status(200).json(result)
  }

  async getById(req, res) {
    const item = await recepcionesService.getById(req.params.id)
    return res.status(200).json({
      item
    })
  }

  async create(req, res) {
    // 1. Extraemos los campos validados por el schema
    const { proveedorId, documento, estado, productos, costoTotal } = req.body

    // 2. Mapeamos al formato que espera el Service
    // 'productos' del front se convierte en 'items' para el servicio
    // 'documento' se usa como folio
    const payload = {
      supplierId: proveedorId,
      folio: documento || `REC-${Date.now()}`,
      fecha: new Date().toISOString(),
      estado: estado,
      items: productos.map(p => ({
        productId: null, // null indica que es producto manual
        productNombre: p.nombre,
        cantidad: Number(p.cantidad),
        costoUnitario: Number(p.costoUnitario)
      })),
      costoTotal: Number(costoTotal)
    }

    // 3. Llamamos al servicio
    const item = await recepcionesService.create(payload, req.user)

    return res.status(201).json({
      message: 'Recepción creada correctamente',
      item
    })
  }

  async update(req, res) {
    // Para update, enviamos el body directamente o mapeado si es necesario
    const item = await recepcionesService.update(req.params.id, req.body, req.user)

    return res.status(200).json({
      message: 'Recepción actualizada correctamente',
      item
    })
  }

  async confirm(req, res) {
    const result = await recepcionesService.confirm(req.params.id, req.user)

    return res.status(200).json(result)
  }

  async remove(req, res) {
    await recepcionesService.remove(req.params.id, req.user)

    return res.status(200).json({
      message: 'Recepción eliminada correctamente'
    })
  }
}

export const recepcionesController = new RecepcionesController()