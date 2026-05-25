import { Router } from 'express'
import { authController } from './auth.controller.js'
import { clientsController} from '../clients/clients.controller.js'
import { validate } from '../../middlewares/validate.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { createClientSchema } from '../clients/clients.schema.js'
import { loginSchema } from './auth.schema.js'

const router = Router()

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(authController.login.bind(authController))
)

router.post(
  '/register',
  validate(createClientSchema), 
  asyncHandler(clientsController.create.bind(clientsController))
)

router.get(
  '/me',
  authenticate,
  requirePermissions(['auth:me']),
  asyncHandler(authController.me.bind(authController))
)

export default router