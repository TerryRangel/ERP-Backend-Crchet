import { z } from 'zod'

const booleanLike = z.union([
  z.boolean(),
  z.enum(['true', 'false'])
]).transform((value) => {
  if (typeof value === 'boolean') return value
  return value === 'true'
})

const nullableString = z.string().optional().nullable()

export const listProductsQuerySchema = z.object({
  q: z.string().optional().default(''),
  activo: booleanLike.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})

export const productIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

export const createProductSchema = z.object({
  sku: z
    .string({ required_error: 'El SKU es obligatorio' })
    .min(2, 'El SKU debe tener al menos 2 caracteres'),
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: nullableString,
  categoria: nullableString,
  unidad: nullableString,
  marca: nullableString,
  modelo: nullableString,
  precioCompra: z.coerce.number().min(0, 'El precio de compra no puede ser negativo').optional().default(0),
  precioVenta: z.coerce.number().min(0, 'El precio de venta no puede ser negativo').optional().default(0),
  stock: z.coerce.number().min(0, 'El stock no puede ser negativo').optional().default(0),
  stockMinimo: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo').optional().default(0),
  activo: z.boolean().optional().default(true),
  imagenUrl: nullableString
})

export const updateProductSchema = z.object({
  sku: z.string().min(2, 'El SKU debe tener al menos 2 caracteres').optional(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  descripcion: z.string().nullable().optional(),
  categoria: z.string().nullable().optional(),
  unidad: z.string().nullable().optional(),
  marca: z.string().nullable().optional(),
  modelo: z.string().nullable().optional(),
  precioCompra: z.coerce.number().min(0, 'El precio de compra no puede ser negativo').optional(),
  precioVenta: z.coerce.number().min(0, 'El precio de venta no puede ser negativo').optional(),
  stock: z.coerce.number().min(0, 'El stock no puede ser negativo').optional(),
  stockMinimo: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo').optional(),
  activo: z.boolean().optional(),
  imagenUrl: z.string().nullable().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
})

export const toggleProductActiveSchema = z.object({
  activo: z.boolean({
    required_error: 'El campo activo es obligatorio'
  })
})