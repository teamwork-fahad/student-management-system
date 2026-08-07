import express from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from './department.controller.js';
import { authenticateUser, authorizeRoles } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Public / Authenticated read routes
router.get('/', authenticateUser, getDepartments);
router.get('/:id', authenticateUser, getDepartmentById);

// Super Admin CRUD write routes
router.post('/', authenticateUser, authorizeRoles('SUPER_ADMIN'), createDepartment);
router.put('/:id', authenticateUser, authorizeRoles('SUPER_ADMIN'), updateDepartment);
router.delete('/:id', authenticateUser, authorizeRoles('SUPER_ADMIN'), deleteDepartment);

export default router;
