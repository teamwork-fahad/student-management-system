import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";
import {
  buildCacheKey,
  fetchWithCache,
  clearCachePatterns,
} from "../../utils/cacheHelper.js";
import {
  addFollowUp,
  convertInquiry,
  createInquiry,
  createLeadSource,
  getAllInquiries,
  getAllLeadSources,
  getFollowUpHistory,
  getInquiryById,
  softDeleteInquiry,
  bulkDeleteInquiries,
  updateInquiry,
  createPublicInquiry,
} from "./inquiry.service.js";
import {
  addFollowUpSchema,
  createInquirySchema,
  createLeadSourceSchema,
  updateInquirySchema,
} from "./inquiry.validation.js";

export const createLeadSourceController = asyncHandler(async (req, res) => {
  const validatedData = createLeadSourceSchema.parse(req.body);
  const leadSource = await createLeadSource(validatedData);

  await clearCachePatterns(["sms:inquiries:*"]);

  return successResponse(res, "Lead source created successfully", leadSource, 201);
});

export const getAllLeadSourcesController = asyncHandler(async (req, res) => {
  const cacheKey = "sms:inquiries:lead-sources";
  const leadSources = await fetchWithCache(cacheKey, 300, () => getAllLeadSources());

  return successResponse(res, "Lead sources fetched successfully", leadSources, 200);
});

export const createInquiryController = asyncHandler(async (req, res) => {
  const validatedData = createInquirySchema.parse(req.body);
  const inquiry = await createInquiry(validatedData);

  await clearCachePatterns(["sms:inquiries:*"]);

  return successResponse(res, "Inquiry created successfully", inquiry, 201);
});

export const getAllInquiriesController = asyncHandler(async (req, res) => {
  const cacheKey = buildCacheKey("sms:inquiries:list", req.query);
  const inquiries = await fetchWithCache(cacheKey, 60, () => getAllInquiries(req.query));

  return successResponse(res, "Inquiries fetched successfully", inquiries, 200);
});

export const getInquiryByIdController = asyncHandler(async (req, res) => {
  const cacheKey = `sms:inquiries:detail:${req.params.id}`;
  const inquiry = await fetchWithCache(cacheKey, 60, () => getInquiryById(req.params.id));

  return successResponse(res, "Inquiry fetched successfully", inquiry, 200);
});

export const updateInquiryController = asyncHandler(async (req, res) => {
  const validatedData = updateInquirySchema.parse(req.body);
  const inquiry = await updateInquiry(req.params.id, validatedData);

  await clearCachePatterns(["sms:inquiries:*"]);

  return successResponse(res, "Inquiry updated successfully", inquiry, 200);
});

export const deleteInquiryController = asyncHandler(async (req, res) => {
  const inquiry = await softDeleteInquiry(req.params.id);

  await clearCachePatterns(["sms:inquiries:*"]);

  return successResponse(res, "Inquiry deleted successfully", inquiry, 200);
});

const bulkDeleteInquiriesSchema = z.object({
  inquiryIds: z
    .array(z.string().trim().min(1, "Invalid inquiry ID"))
    .min(1, "At least one inquiry ID is required"),
});

export const bulkDeleteInquiriesController = asyncHandler(async (req, res) => {
  const validated = bulkDeleteInquiriesSchema.parse(req.body);
  const result = await bulkDeleteInquiries(validated.inquiryIds);

  await clearCachePatterns(["sms:inquiries:*"]);

  return successResponse(
    res,
    `${result.count} inquiry/inquiries deleted successfully`,
    result,
    200
  );
});

export const addFollowUpController = asyncHandler(async (req, res) => {
  const validatedData = addFollowUpSchema.parse(req.body);
  const followUp = await addFollowUp(req.params.id, validatedData, req.user.id);

  await clearCachePatterns(["sms:inquiries:*"]);

  return successResponse(res, "Follow-up added successfully", followUp, 201);
});

export const getFollowUpHistoryController = asyncHandler(async (req, res) => {
  const cacheKey = `sms:inquiries:followups:${req.params.id}`;
  const followUps = await fetchWithCache(cacheKey, 60, () => getFollowUpHistory(req.params.id));

  return successResponse(
    res,
    "Follow-up history fetched successfully",
    followUps,
    200
  );
});

export const convertInquiryController = asyncHandler(async (req, res) => {
  const result = await convertInquiry(req.params.id);

  await clearCachePatterns(["sms:inquiries:*", "sms:admissions:*"]);

  return successResponse(
    res,
    "Inquiry is ready for Admission Module.",
    result,
    200
  );
});

export const createPublicInquiryController = asyncHandler(async (req, res) => {
  const validatedData = createInquirySchema.parse(req.body);
  const inquiry = await createPublicInquiry(validatedData);

  await clearCachePatterns(["sms:inquiries:*"]);

  return successResponse(
    res,
    "Thank you! Your inquiry has been submitted successfully. Our team will contact you soon.",
    inquiry,
    201
  );
});

