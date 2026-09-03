import express from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from './department.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = express.Router();

// Public / Authenticated read routes
router.get('/public', getDepartments);
router.get('/', authenticate, getDepartments);
router.get('/:id', authenticate, getDepartmentById);

// Super Admin CRUD write routes
router.post('/', authenticate, authorize('SUPER_ADMIN'), createDepartment);
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), updateDepartment);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), deleteDepartment);

export default router;
