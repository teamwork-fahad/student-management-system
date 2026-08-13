import { z } from "zod";
import {
  getDepartmentsService,
  getDepartmentByIdService,
  createDepartmentService,
  updateDepartmentService,
  deleteDepartmentService,
} from './department.service.js';
import {
  buildCacheKey,
  fetchWithCache,
  clearCachePatterns,
} from "../../utils/cacheHelper.js";

const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, "Department name must be at least 2 characters"),
  code: z.string().trim().min(1, "Department code is required"),
  description: z.string().trim().optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

export const getDepartments = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true' || req.user?.role === 'SUPER_ADMIN';
    const cacheKey = buildCacheKey("sms:departments:list", { includeInactive, ...req.query });
    const departments = await fetchWithCache(cacheKey, 300, () => getDepartmentsService({ includeInactive }));

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
    const cacheKey = `sms:departments:detail:${req.params.id}`;
    const department = await fetchWithCache(cacheKey, 300, () => getDepartmentByIdService(req.params.id));
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
    await clearCachePatterns(["sms:departments:*"]);

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
    await clearCachePatterns(["sms:departments:*"]);

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
    await clearCachePatterns(["sms:departments:*"]);

    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
