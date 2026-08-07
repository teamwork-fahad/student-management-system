import prisma from '../../config/prisma.js';
import { createHttpError } from '../../utils/httpError.js';

export const getDepartmentsService = async ({ includeInactive = false } = {}) => {
  const where = includeInactive ? {} : { isActive: true };
  const departments = await prisma.department.findMany({
    where,
    include: {
      _count: {
        select: { courses: true },
      },
    },
    orderBy: { name: 'asc' },
  });
  return departments;
};

export const getDepartmentByIdService = async (id) => {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      courses: true,
    },
  });
  if (!department) {
    throw createHttpError('Department not found', 404);
  }
  return department;
};

export const createDepartmentService = async (data) => {
  const { name, code, description } = data;
  if (!name || !name.trim()) {
    throw createHttpError('Department name is required', 400);
  }

  const existingName = await prisma.department.findUnique({
    where: { name: name.trim() },
  });
  if (existingName) {
    throw createHttpError('A department with this name already exists', 400);
  }

  if (code && code.trim()) {
    const existingCode = await prisma.department.findUnique({
      where: { code: code.trim() },
    });
    if (existingCode) {
      throw createHttpError('A department with this code already exists', 400);
    }
  }

  const department = await prisma.department.create({
    data: {
      name: name.trim(),
      code: code ? code.trim() : null,
      description: description ? description.trim() : null,
      isActive: true,
    },
  });

  return department;
};

export const updateDepartmentService = async (id, data) => {
  const { name, code, description, isActive } = data;

  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) {
    throw createHttpError('Department not found', 404);
  }

  if (name && name.trim() !== department.name) {
    const existingName = await prisma.department.findUnique({
      where: { name: name.trim() },
    });
    if (existingName) {
      throw createHttpError('A department with this name already exists', 400);
    }
  }

  if (code && code.trim() && code.trim() !== department.code) {
    const existingCode = await prisma.department.findUnique({
      where: { code: code.trim() },
    });
    if (existingCode) {
      throw createHttpError('A department with this code already exists', 400);
    }
  }

  const updated = await prisma.department.update({
    where: { id },
    data: {
      name: name ? name.trim() : department.name,
      code: code !== undefined ? (code ? code.trim() : null) : department.code,
      description: description !== undefined ? (description ? description.trim() : null) : department.description,
      isActive: isActive !== undefined ? Boolean(isActive) : department.isActive,
    },
  });

  return updated;
};

export const deleteDepartmentService = async (id) => {
  const department = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { courses: true } } },
  });

  if (!department) {
    throw createHttpError('Department not found', 404);
  }

  if (department._count.courses > 0) {
    // Soft delete / deactivate if courses are attached
    return await prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
  }

  return await prisma.department.delete({
    where: { id },
  });
};
