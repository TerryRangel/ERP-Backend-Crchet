import { Router } from 'express'
import { usersController } from './users.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  createUserSchema,
  listUsersQuerySchema,
  toggleActiveSchema,
  updateUserSchema,
  userIdParamSchema
} from './users.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions(['users:read']),
  validate(listUsersQuerySchema, 'query'),
  asyncHandler(usersController.list.bind(usersController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions(['users:read']),
  validate(userIdParamSchema, 'params'),
  asyncHandler(usersController.getById.bind(usersController))
)

router.post(
  '/',
  authenticate,
  requirePermissions(['users:create']),
  validate(createUserSchema),
  asyncHandler(usersController.create.bind(usersController))
)

router.patch(
  '/:id',
  authenticate,
  (req, res, next) => {
    const tokenUserId = (req.user && (req.user.id || req.user.uid || req.user.user_id || req.user.sub)) || req.userId || req.uid;
    if (tokenUserId && req.params.id && String(tokenUserId) === String(req.params.id)) {
      console.log("✅ RESULTADO: Eres el dueño. Pasando...");
      return next();
    }
    return requirePermissions(['users:update'])(req, res, next);
  },
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  asyncHandler(usersController.update.bind(usersController))
)

router.patch(
  '/:id/toggle-active',
  authenticate,
  requirePermissions(['users:update']),
  validate(userIdParamSchema, 'params'),
  validate(toggleActiveSchema),
  asyncHandler(usersController.toggleActive.bind(usersController))
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions(['users:delete']),
  validate(userIdParamSchema, 'params'),
  asyncHandler(usersController.remove.bind(usersController))
)

export default router