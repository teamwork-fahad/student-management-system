import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";
import {
  completeAdmission,
  getAdmissionById,
  getAllAdmissions,
  updateAdmission,
} from "./admission.service.js";
import {
  createAdmissionSchema,
  updateAdmissionSchema,
} from "./admission.validation.js";

/**
 * Controller to process a new Admission
 * Workflow: Validate Body -> Call completeAdmission service -> Return HTTP 201 Response
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
 * Controller to fetch all Admissions with optional search and filter criteria
 */
export const getAdmissionsController = asyncHandler(async (req, res) => {
  const admissions = await getAllAdmissions(req.query);

  return successResponse(
    res,
    "Admissions fetched successfully",
    admissions,
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
