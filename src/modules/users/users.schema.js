import { z } from 'zod'

const booleanLike = z.union([
  z.boolean(),
  z.enum(['true', 'false'])
]).transform((value) => {
  if (typeof value === 'boolean') return value
  return value === 'true'
})

export const listUsersQuerySchema = z.object({
  q: z.string().optional().default(''),
  activo: booleanLike.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})

export const userIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

export const createUserSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z
    .string({ required_error: 'El apellido es obligatorio' })
    .min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z
    .string({ required_error: 'El email es obligatorio' })
    .email('El email no es válido'),
  usuario: z
    .string({ required_error: 'El usuario es obligatorio' })
    .min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.string().optional().nullable(),
  roleId: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional().default([]),
  activo: z.boolean().optional().default(true),
  fotoPerfil: z.string().url().optional().nullable()
})

export const updateUserSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').optional(),
  email: z.string().email('El email no es válido').optional(),
  usuario: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  role: z.string().nullable().optional(),
  roleId: z.string().nullable().optional(),
  permissions: z.array(z.string()).optional(),
  activo: z.boolean().optional(),
  fotoPerfil: z.string().url().optional().nullable()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
})

export const toggleActiveSchema = z.object({
  activo: z.boolean({
    required_error: 'El campo activo es obligatorio'
  })
})