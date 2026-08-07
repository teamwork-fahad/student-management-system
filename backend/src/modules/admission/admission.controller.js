import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";
import {
  completeAdmission,
  getAdmissionById,
  getAdmissionStatistics,
  getAllAdmissions,
  searchAdmissions,
  updateAdmission,
  updateAdmissionStatusService,
  deleteAdmissionService,
  bulkUpdateAdmissionStatusService,
} from "./admission.service.js";
import {
  createAdmissionSchema,
  updateAdmissionSchema,
} from "./admission.validation.js";

/**
 * Controller to process a new Admission
 */
export const createAdmissionController = asyncHandler(async (req, res) => {
  const validatedData = createAdmissionSchema.parse(req.body);

  const admissionResult = await completeAdmission({
    ...validatedData,
    admittedBy: req.user.id,
  });

  return successResponse(
    res,
    "Admission completed successfully",
    admissionResult,
    201
  );
});

/**
 * Controller to fetch all Admissions with pagination, filters, search, and sorting
 */
export const getAdmissionsController = asyncHandler(async (req, res) => {
  const result = await getAllAdmissions(req.query);

  return successResponse(
    res,
    "Admissions fetched successfully",
    result,
    200
  );
});

/**
 * Controller to fetch dedicated search results for Admissions
 */
export const searchAdmissionsController = asyncHandler(async (req, res) => {
  const query = req.query.q || req.query.query || req.query.search || "";
  const result = await searchAdmissions(query, req.query);

  return successResponse(
    res,
    "Admission search completed successfully",
    result,
    200
  );
});

/**
 * Controller to fetch aggregate Admission Statistics
 */
export const getAdmissionStatisticsController = asyncHandler(async (req, res) => {
  const statistics = await getAdmissionStatistics();

  return successResponse(
    res,
    "Admission statistics fetched successfully",
    statistics,
    200
  );
});

/**
 * Controller to fetch a single Admission by ID
 */
export const getAdmissionByIdController = asyncHandler(async (req, res) => {
  const admission = await getAdmissionById(req.params.id);

  return successResponse(
    res,
    "Admission fetched successfully",
    admission,
    200
  );
});

/**
 * Controller to update allowed fields of an Admission
 */
export const updateAdmissionController = asyncHandler(async (req, res) => {
  const validatedData = updateAdmissionSchema.parse(req.body);

  const updatedAdmission = await updateAdmission(
    req.params.id,
    validatedData,
    req.user.id
  );

  return successResponse(
    res,
    "Admission updated successfully",
    updatedAdmission,
    200
  );
});

export const updateAdmissionStatusController = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const result = await updateAdmissionStatusService(req.params.id, status);
  return successResponse(res, "Course status updated successfully", result, 200);
});

export const deleteAdmissionController = asyncHandler(async (req, res) => {
  const result = await deleteAdmissionService(req.params.id);
  return successResponse(res, "Course enrollment deleted successfully", result, 200);
});

export const bulkUpdateAdmissionStatusController = asyncHandler(async (req, res) => {
  const { admissionIds, status } = req.body;
  const result = await bulkUpdateAdmissionStatusService(admissionIds, status);
  return successResponse(res, "Bulk course status updated successfully", result, 200);
});
