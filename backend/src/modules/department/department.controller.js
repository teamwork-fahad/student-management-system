import { z } from "zod";
import {
  getDepartmentsService,
  getDepartmentByIdService,
  createDepartmentService,
  updateDepartmentService,
  deleteDepartmentService,
} from './department.service.js';

const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, "Department name must be at least 2 characters"),
  code: z.string().trim().min(1, "Department code is required"),
  description: z.string().trim().optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

import { queryCache } from "../../utils/cache.js";

export const getDepartments = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true' || req.user?.role === 'SUPER_ADMIN';
    const cacheKey = `departments:${includeInactive}`;
    const cached = queryCache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const departments = await getDepartmentsService({ includeInactive });
    queryCache.set(cacheKey, departments, 30);

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req, res, next) => {
  try {
    const department = await getDepartmentByIdService(req.params.id);
    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const validatedData = createDepartmentSchema.parse(req.body);
    const department = await createDepartmentService(validatedData);
    queryCache.flushPattern("departments:");

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const validatedData = updateDepartmentSchema.parse(req.body);
    const department = await updateDepartmentService(req.params.id, validatedData);
    queryCache.flushPattern("departments:");

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    await deleteDepartmentService(req.params.id);
    queryCache.flushPattern("departments:");

    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
