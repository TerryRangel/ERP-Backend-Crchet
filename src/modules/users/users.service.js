import bcrypt from 'bcryptjs'
import { usersRepository } from './users.repository.js'
import { logAuditEvent } from '../../utils/audit.js'

export class UsersService {
  async list(query) {
    const {
      q = '',
      activo,
      page = 1,
      limit = 10
    } = query

    const allUsers = await usersRepository.findAll()

    let filtered = allUsers

    if (q) {
      const term = q.trim().toLowerCase()

      filtered = filtered.filter((user) => {
        const fullName = `${user.nombre || ''} ${user.apellido || ''}`.trim().toLowerCase()

        return (
          String(user.nombre || '').toLowerCase().includes(term) ||
          String(user.apellido || '').toLowerCase().includes(term) ||
          String(user.email || '').toLowerCase().includes(term) ||
          String(user.usuario || '').toLowerCase().includes(term) ||
          fullName.includes(term)
        )
      })
    }

    if (typeof activo === 'boolean') {
      filtered = filtered.filter((user) => (user.activo ?? true) === activo)
    }

    filtered.sort((a, b) => {
      const aName = `${a.nombre || ''} ${a.apellido || ''}`.trim().toLowerCase()
      const bName = `${b.nombre || ''} ${b.apellido || ''}`.trim().toLowerCase()
      return aName.localeCompare(bName)
    })

    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit
    const items = filtered.slice(start, end).map((user) => this.sanitizeUser(user))

    return {
      items,
      total,
      page,
      limit
    }
  }

  async getById(id) {
    const user = await usersRepository.findById(id)

    if (!user) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }

    return this.sanitizeUser(user)
  }

  async create(payload, currentUser = null) {
    const existingByUsuario = await usersRepository.findByUsuario(payload.usuario)

    if (existingByUsuario) {
      const error = new Error('El usuario ya existe')
      error.statusCode = 409
      throw error
    }

    const existingByEmail = await usersRepository.findByEmail(payload.email)

    if (existingByEmail) {
      const error = new Error('El email ya existe')
      error.statusCode = 409
      throw error
    }

    const passwordHash = await bcrypt.hash(payload.password, 10)

    const data = {
      nombre: payload.nombre,
      apellido: payload.apellido,
      email: payload.email,
      usuario: payload.usuario,
      passwordHash,
      role: payload.role || null,
      roleId: payload.roleId || null,
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
      activo: payload.activo ?? true,
      fotoPerfil: payload.fotoPerfil || null, // 👉 1. Lo agregamos al crear
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const created = await usersRepository.create(data)
    const sanitized = this.sanitizeUser(created)

    await logAuditEvent({
      action: 'CREATE',
      resource: 'users',
      resourceId: created.id,
      details: {
        usuario: sanitized.usuario,
        email: sanitized.email,
        role: sanitized.role,
        roleId: sanitized.roleId,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async update(id, payload, currentUser = null) {
    const currentUserRecord = await usersRepository.findById(id)

    if (!currentUserRecord) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }

    if (payload.usuario && payload.usuario !== currentUserRecord.usuario) {
      const existingByUsuario = await usersRepository.findByUsuario(payload.usuario)

      if (existingByUsuario && existingByUsuario.id !== id) {
        const error = new Error('El usuario ya existe')
        error.statusCode = 409
        throw error
      }
    }

    if (payload.email && payload.email !== currentUserRecord.email) {
      const existingByEmail = await usersRepository.findByEmail(payload.email)

      if (existingByEmail && existingByEmail.id !== id) {
        const error = new Error('El email ya existe')
        error.statusCode = 409
        throw error
      }
    }

    const data = {
      updatedAt: new Date().toISOString()
    }

    if (payload.nombre !== undefined) data.nombre = payload.nombre
    if (payload.apellido !== undefined) data.apellido = payload.apellido
    if (payload.email !== undefined) data.email = payload.email
    if (payload.usuario !== undefined) data.usuario = payload.usuario
    if (payload.role !== undefined) data.role = payload.role
    if (payload.roleId !== undefined) data.roleId = payload.roleId
    if (payload.permissions !== undefined) data.permissions = payload.permissions
    if (payload.activo !== undefined) data.activo = payload.activo
    if (payload.fotoPerfil !== undefined) data.fotoPerfil = payload.fotoPerfil // 👉 2. Lo agregamos al actualizar

    if (payload.password) {
      data.passwordHash = await bcrypt.hash(payload.password, 10)
    }

    const updated = await usersRepository.update(id, data)
    const sanitized = this.sanitizeUser(updated)

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'users',
      resourceId: updated.id,
      details: {
        changes: Object.keys(payload),
        usuario: sanitized.usuario,
        email: sanitized.email,
        role: sanitized.role,
        roleId: sanitized.roleId,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async toggleActive(id, activo, currentUser = null) {
    const currentUserRecord = await usersRepository.findById(id)

    if (!currentUserRecord) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }

    const updated = await usersRepository.update(id, {
      activo,
      updatedAt: new Date().toISOString()
    })

    const sanitized = this.sanitizeUser(updated)

    await logAuditEvent({
      action: 'TOGGLE_ACTIVE',
      resource: 'users',
      resourceId: updated.id,
      details: {
        usuario: sanitized.usuario,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async remove(id, currentUser = null) {
    const currentUserRecord = await usersRepository.findById(id)

    if (!currentUserRecord) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }

    await usersRepository.remove(id)

    await logAuditEvent({
      action: 'DELETE',
      resource: 'users',
      resourceId: id,
      details: {
        usuario: currentUserRecord.usuario || '',
        email: currentUserRecord.email || ''
      },
      currentUser
    })

    return {
      success: true
    }
  }

  // 👉 3. Lo agregamos aquí para que el Frontend pueda ver la foto
  sanitizeUser(user) {
    return {
      id: user.id,
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      email: user.email || '',
      usuario: user.usuario || '',
      fotoPerfil: user.fotoPerfil || null, 
      role: user.role || null,
      roleId: user.roleId || null,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      activo: user.activo ?? true,
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || null
    }
  }
}

export const usersService = new UsersService()