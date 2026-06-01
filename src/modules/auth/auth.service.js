import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { signAccessToken } from '../../config/jwt.js'
import { authRepository } from './auth.repository.js'

// Importamos el repositorio de usuarios para poder buscar el correo y guardar el token
import { usersRepository } from '../users/users.repository.js' 

export class AuthService {
  async login(payload) {
    const { usuario, password } = payload

    const user = await authRepository.findByUsuario(usuario)

    if (!user) {
      const error = new Error('Credenciales inválidas')
      error.statusCode = 401
      throw error
    }

    if (user.activo === false) {
      const error = new Error('Usuario inactivo')
      error.statusCode = 403
      throw error
    }

    const passwordHash = user.passwordHash || user.password

    if (!passwordHash) {
      const error = new Error('El usuario no tiene contraseña configurada')
      error.statusCode = 500
      throw error
    }

    const isValidPassword = await bcrypt.compare(password, passwordHash)

    if (!isValidPassword) {
      const error = new Error('Credenciales inválidas')
      error.statusCode = 401
      throw error
    }

    const token = signAccessToken({
      sub: user.id,
      usuario: user.usuario,
      role: user.role || null,
      roleId: user.roleId || null,
      permissions: Array.isArray(user.permissions) ? user.permissions : []
    })

    return {
      token,
      user: this.sanitizeUser(user)
    }
  }

  async me(userId) {
    const user = await authRepository.findById(userId)

    if (!user) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }

    if (user.activo === false) {
      const error = new Error('Usuario inactivo')
      error.statusCode = 403
      throw error
    }

    return this.sanitizeUser(user)
  }

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
      activo: user.activo ?? true
    }
  }

  // ─── NUEVAS FUNCIONES DE RECUPERACIÓN ─────────────────────────────────

  async forgotPassword(email) {
    // 1. Buscar si el usuario existe por su correo
    const user = await usersRepository.findByEmail(email);
    if (!user) return; // Retornamos silenciosamente por seguridad

    // 2. Generar un Token aleatorio
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 3. El token expira en 1 hora (3600000 ms)
    const resetPasswordExpires = Date.now() + 3600000; 

    // 4. Guardar en Firebase
    await usersRepository.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetPasswordExpires
    });

    // 5. Configurar Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail', 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 6. Enviar correo (usamos FRONTEND_URL del .env o localhost por defecto)
    const frontendUrl = process.env.FRONTEND_URL || 'https://crochet-flame-three.vercel.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    await transporter.sendMail({
      from: `"Soporte ERP" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Recuperación de Contraseña - ERP',
      html: `
        <h2>¿Olvidaste tu contraseña?</h2>
        <p>Hiciste una solicitud para recuperar tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>
        <a href="${resetUrl}" style="background-color: #8d9b70; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Restablecer Contraseña</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">Si no fuiste tú, ignora este correo. El enlace caducará en 1 hora.</p>
      `
    });
  }

  async resetPassword(token, newPassword) {
    // 1. Buscar al usuario por el token
    const user = await usersRepository.findByResetToken(token);

    if (!user) {
      const error = new Error('El token es inválido o ha expirado');
      error.statusCode = 400;
      throw error;
    }

    // 2. Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // 3. Actualizar la contraseña en Firebase y BORRAR el token
    await usersRepository.update(user.id, {
      passwordHash: passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });
  }
}

export const authService = new AuthService()
