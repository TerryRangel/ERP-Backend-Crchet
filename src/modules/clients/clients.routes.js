import { Router } from 'express'
import { clientsController } from './clients.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  clientIdParamSchema,
  createClientSchema,
  listClientsQuerySchema,
  toggleClientActiveSchema,
  updateClientSchema
} from './clients.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions(['clients:read']),
  validate(listClientsQuerySchema, 'query'),
  asyncHandler(clientsController.list.bind(clientsController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions(['clients:read']),
  validate(clientIdParamSchema, 'params'),
  asyncHandler(clientsController.getById.bind(clientsController))
)

router.post(
  '/',
  authenticate,
  requirePermissions(['clients:create']),
  validate(createClientSchema),
  asyncHandler(clientsController.create.bind(clientsController))
)

router.patch(
  '/:id',
  authenticate,
  requirePermissions(['clients:create']), 
  validate(clientIdParamSchema, 'params'),
  validate(updateClientSchema),
  asyncHandler(clientsController.update.bind(clientsController))
)

router.patch(
  '/:id/toggle-active',
  authenticate,
  requirePermissions(['clients:create']), 
  validate(clientIdParamSchema, 'params'),
  validate(toggleClientActiveSchema),
  asyncHandler(clientsController.toggleActive.bind(clientsController))
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions(['clients:create']), // <-- Antes decía clients:delete
  validate(clientIdParamSchema, 'params'),
  asyncHandler(clientsController.remove.bind(clientsController))
)

export default router