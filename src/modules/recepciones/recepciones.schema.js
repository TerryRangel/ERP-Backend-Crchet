import { z } from 'zod';

// Esquema para cada producto capturado manualmente
const productoManualSchema = z.object({
  nombre: z.string({ required_error: 'El nombre del producto es obligatorio' }).min(1, 'El nombre es obligatorio'),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  costoUnitario: z.coerce.number().min(0, 'El costo unitario no puede ser negativo')
});

// Schema principal de creación
export const createRecepcionSchema = z.object({
  proveedorId: z.string({ required_error: 'El proveedor es obligatorio' }).min(1, 'El proveedor es obligatorio'),
  documento: z.string().optional().nullable(),
  estado: z.enum(['ENTREGADO', 'PENDIENTE'], { 
    errorMap: () => ({ message: 'El estado debe ser ENTREGADO o PENDIENTE' }) 
  }),
  productos: z.array(productoManualSchema).min(1, 'Debes agregar al menos un producto'),
  totalArticulos: z.coerce.number().int().min(0),
  costoTotal: z.coerce.number().min(0)
});

// Schema de actualización (ajustado para ser flexible)
export const updateRecepcionSchema = z.object({
  proveedorId: z.string().min(1).optional(),
  documento: z.string().optional().nullable(),
  estado: z.enum(['ENTREGADO', 'PENDIENTE', 'CANCELADO']).optional(),
  productos: z.array(productoManualSchema).optional(),
  totalArticulos: z.coerce.number().optional(),
  costoTotal: z.coerce.number().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
});

// Schemas auxiliares (para listar y obtener por ID)
export const listRecepcionesQuerySchema = z.object({
  q: z.string().optional().default(''),
  status: z.enum(['ENTREGADO', 'PENDIENTE', 'CANCELADO']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
});

export const recepcionIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
});