import { authService } from './auth.service.js'

export class AuthController {
  async login(req, res) {
    const result = await authService.login(req.body)
    return res.status(200).json(result)
  }

  async me(req, res) {
    const userId = req.user?.sub
    const user = await authService.me(userId)
    return res.status(200).json({ user })
  }

  async forgotPassword(req, res) {
    const { email } = req.body;
    await authService.forgotPassword(email);
    
    return res.status(200).json({ 
      message: 'Si el correo existe en nuestro sistema, hemos enviado un enlace de recuperación.' 
    });
  }

  async resetPassword(req, res) {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    
    return res.status(200).json({ 
      message: 'Contraseña actualizada correctamente' 
    });
  }
}

export const authController = new AuthController()