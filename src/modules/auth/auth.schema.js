import { z } from 'zod'

export const loginSchema = z.object({
  usuario: z
    .string({
      required_error: 'El usuario es obligatorio'
    })
    .min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z
    .string({
      required_error: 'La contraseña es obligatoria'
    })
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'El email es obligatorio' }).email('El email no es válido')
});

export const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'El token es obligatorio' }),
  newPassword: z.string({ required_error: 'La nueva contraseña es obligatoria' }).min(6, 'Debe tener al menos 6 caracteres')
});