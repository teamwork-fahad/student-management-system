import { z } from "zod";
import {
  getPartiesService,
  createPartyService,
  getPartyByIdService,
  updatePartyService,
  deletePartyService,
} from "./party.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import { clearCachePatterns } from "../../utils/cacheHelper.js";

const createPartySchema = z.object({
  name: z.string({ required_error: "Party name is required" }).trim().min(2, "Party name must be at least 2 characters"),
  contactPerson: z.string().trim().nullish(),
  mobile: z.string().trim().nullish(),
  email: z.string().trim().nullish(),
  address: z.string().trim().nullish(),
  notes: z.string().trim().nullish(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
});

export const getParties = asyncHandler(async (req, res) => {
  const result = await getPartiesService(req.query);
  return successResponse(res, "Parties fetched successfully", result, 200);
});

export const createParty = asyncHandler(async (req, res) => {
  const validatedData = createPartySchema.parse(req.body);
  const party = await createPartyService(validatedData);
  await clearCachePatterns(["sms:expenses:*"]);
  return successResponse(res, "Party created successfully", party, 201);
});

export const getPartyById = asyncHandler(async (req, res) => {
  const result = await getPartyByIdService(req.params.id);
  if (!result) {
    return errorResponse(res, "Party not found", 404);
  }
  return successResponse(res, "Party details fetched successfully", result, 200);
});

export const updateParty = asyncHandler(async (req, res) => {
  const party = await updatePartyService(req.params.id, req.body);
  await clearCachePatterns(["sms:expenses:*"]);
  return successResponse(res, "Party updated successfully", party, 200);
});

export const deleteParty = asyncHandler(async (req, res) => {
  await deletePartyService(req.params.id);
  await clearCachePatterns(["sms:expenses:*"]);
  return successResponse(res, "Party deleted successfully", {}, 200);
});
