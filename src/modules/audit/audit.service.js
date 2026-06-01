import { auditRepository } from './audit.repository.js'

export class AuditService {
  async list(query) {
    const {
      q = '',
      resource,
      action,
      userId,
      page = 1,
      limit = 100
    } = query

    const allLogs = await auditRepository.findAll()

    let filtered = allLogs

    if (resource) {
      filtered = filtered.filter((log) => String(log.resource || '') === resource)
    }

    if (action) {
      filtered = filtered.filter((log) => String(log.action || '') === action)
    }

    if (userId) {
      filtered = filtered.filter((log) => String(log.userId || '') === userId)
    }

    if (q) {
      const term = q.trim().toLowerCase()

      filtered = filtered.filter((log) => {
        return (
          String(log.action || '').toLowerCase().includes(term) ||
          String(log.resource || '').toLowerCase().includes(term) ||
          String(log.resourceId || '').toLowerCase().includes(term) ||
          String(log.usuario || '').toLowerCase().includes(term) ||
          JSON.stringify(log.details || {}).toLowerCase().includes(term)
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
    const items = filtered.slice(start, end).map((log) => this.sanitizeAudit(log))

    return {
      items,
      total,
      page,
      limit
    }
  }

  async getById(id) {
    const log = await auditRepository.findById(id)

    if (!log) {
      const error = new Error('Registro de auditoría no encontrado')
      error.statusCode = 404
      throw error
    }

    return this.sanitizeAudit(log)
  }

  async create(payload) {
    const data = {
      action: payload.action,
      resource: payload.resource,
      resourceId: payload.resourceId || '',
      details: payload.details || {},
      userId: payload.userId || '',
      usuario: payload.usuario || '',
      createdAt: new Date().toISOString()
    }

    const created = await auditRepository.create(data)

    return this.sanitizeAudit(created)
  }

  sanitizeAudit(log) {
    return {
      id: log.id,
      action: log.action || '',
      resource: log.resource || '',
      resourceId: log.resourceId || '',
      details: log.details || {},
      userId: log.userId || '',
      usuario: log.usuario || '',
      createdAt: log.createdAt || null
    }
  }
}

export const auditService = new AuditService()