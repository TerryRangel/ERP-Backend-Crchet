import { recepcionesRepository } from './recepciones.repository.js'
import { logAuditEvent } from '../../utils/audit.js'

function normalizeOptionalText(value) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? '' : trimmed
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

export class RecepcionesService {
  async list(query) {
    const { q = '', status, page = 1, limit = 10 } = query
    const allRecepciones = await recepcionesRepository.findAll()
    let filtered = allRecepciones

    if (status) {
      filtered = filtered.filter((recepcion) => recepcion.status === status)
    }

    if (q) {
      const term = q.trim().toLowerCase()
      filtered = filtered.filter((recepcion) => {
        return (
          String(recepcion.folio || '').toLowerCase().includes(term) ||
          String(recepcion.supplierNombre || '').toLowerCase().includes(term) ||
          String(recepcion.comentarios || '').toLowerCase().includes(term) ||
          String(recepcion.status || '').toLowerCase().includes(term)
        )
      })
    }

    filtered.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime()
      const bDate = new Date(b.createdAt || 0).getTime()
      return bDate - aDate
    })

    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit
    const items = filtered.slice(start, end).map((recepcion) => this.sanitizeRecepcion(recepcion))

    return { items, total, page, limit }
  }

  async getById(id) {
    const recepcion = await recepcionesRepository.findById(id)
    if (!recepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }
    return this.sanitizeRecepcion(recepcion)
  }

  async create(payload, currentUser = null) {
    // 1. Validar Proveedor
    const supplier = await recepcionesRepository.findSupplierById(payload.supplierId)
    if (!supplier) {
      const error = new Error('Proveedor no encontrado')
      error.statusCode = 404
      throw error
    }

    // 2. Procesar Items (Soportando manual y catálogo)
    const items = []
    let total = 0

    for (const rawItem of payload.items) {
      let productData = {
        productId: rawItem.productId || null,
        sku: rawItem.sku || 'MANUAL',
        productNombre: rawItem.productNombre,
        cantidad: Number(rawItem.cantidad),
        costoUnitario: round2(rawItem.costoUnitario),
        subtotal: round2(Number(rawItem.cantidad) * round2(rawItem.costoUnitario))
      }

      // Si tiene productId, verificamos que el producto exista en catálogo
      if (rawItem.productId) {
        const product = await recepcionesRepository.findProductById(rawItem.productId)
        if (!product) {
          const error = new Error(`Producto no encontrado: ${rawItem.productId}`)
          error.statusCode = 404
          throw error
        }
        productData.sku = product.sku || ''
        productData.productNombre = product.nombre || ''
      }

      items.push(productData)
      total += productData.subtotal
    }

    // 3. Crear objeto de recepción
    const data = {
      supplierId: supplier.id,
      supplierNombre: supplier.nombre || '',
      fecha: new Date().toISOString(), // Usamos fecha actual si no viene
      folio: payload.folio.trim(),
      comentarios: normalizeOptionalText(payload.comentarios) || '',
      status: payload.estado === 'ENTREGADO' ? 'CONFIRMED' : 'DRAFT',
      items,
      total: round2(total),
      confirmedAt: payload.estado === 'ENTREGADO' ? new Date().toISOString() : null,
      confirmedBy: payload.estado === 'ENTREGADO' ? currentUser?.usuario || '' : '',
      confirmedByUserId: payload.estado === 'ENTREGADO' ? currentUser?.sub || '' : '',
      createdBy: currentUser?.usuario || '',
      createdByUserId: currentUser?.sub || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const created = await recepcionesRepository.create(data)
    const sanitized = this.sanitizeRecepcion(created)

    await logAuditEvent({
      action: 'CREATE',
      resource: 'recepciones',
      resourceId: created.id,
      details: { folio: sanitized.folio, supplierNombre: sanitized.supplierNombre, status: sanitized.status, itemsCount: sanitized.items.length, total: sanitized.total },
      currentUser
    })

    return sanitized
  }

  async update(id, payload, currentUser = null) {
    const currentRecepcion = await recepcionesRepository.findById(id)
    if (!currentRecepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }

    if (currentRecepcion.status === 'CONFIRMED') {
      const error = new Error('No puedes editar una recepción confirmada')
      error.statusCode = 400
      throw error
    }

    const data = { updatedAt: new Date().toISOString() }

    // (Lógica de actualización simplificada para mantener compatibilidad)
    if (payload.supplierId) {
      const supplier = await recepcionesRepository.findSupplierById(payload.supplierId)
      if (!supplier) throw new Error('Proveedor no encontrado')
      data.supplierId = supplier.id
      data.supplierNombre = supplier.nombre
    }
    
    if (payload.items) data.items = payload.items
    
    const updated = await recepcionesRepository.update(id, data)
    return this.sanitizeRecepcion(updated)
  }

  async confirm(id, currentUser = null) {
    const recepcion = await recepcionesRepository.findById(id)
    if (!recepcion) throw new Error('Recepción no encontrada')
    if (recepcion.status === 'CONFIRMED') throw new Error('La recepción ya fue confirmada')

    // Lógica de inventario (Solo si tienen productId)
    for (const item of recepcion.items) {
      if (item.productId) {
        const product = await recepcionesRepository.findProductById(item.productId)
        if (product) {
          await recepcionesRepository.updateProduct(product.id, {
            stock: Number(product.stock || 0) + Number(item.cantidad || 0)
          })
        }
      }
    }

    const updatedRecepcion = await recepcionesRepository.update(recepcion.id, {
      status: 'CONFIRMED',
      confirmedAt: new Date().toISOString()
    })

    return { message: 'Recepción confirmada', item: this.sanitizeRecepcion(updatedRecepcion) }
  }

  async remove(id, currentUser = null) {
    const recepcion = await recepcionesRepository.findById(id)
    if (!recepcion) throw new Error('Recepción no encontrada')
    await recepcionesRepository.remove(id)
    return { success: true }
  }

  sanitizeRecepcion(recepcion) {
    return {
      id: recepcion.id,
      supplierId: recepcion.supplierId || '',
      supplierNombre: recepcion.supplierNombre || '',
      fecha: recepcion.fecha || '',
      folio: recepcion.folio || '',
      comentarios: recepcion.comentarios || '',
      status: recepcion.status || 'DRAFT',
      items: Array.isArray(recepcion.items)
        ? recepcion.items.map((item) => ({
            productId: item.productId || null,
            productNombre: item.productNombre || '',
            cantidad: Number(item.cantidad || 0),
            costoUnitario: Number(item.costoUnitario || 0),
            subtotal: Number(item.subtotal || 0)
          }))
        : [],
      total: Number(recepcion.total || 0)
    }
  }

  sanitizeMovement(movement) {
    return { id: movement.id, productId: movement.productId || '', cantidad: Number(movement.cantidad || 0) }
  }
}

export const recepcionesService = new RecepcionesService()