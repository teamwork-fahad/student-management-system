import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  addFollowUpController,
  convertInquiryController,
  createInquiryController,
  createLeadSourceController,
  deleteInquiryController,
  getAllInquiriesController,
  getAllLeadSourcesController,
  getFollowUpHistoryController,
  getInquiryByIdController,
  updateInquiryController,
} from "./inquiry.controller.js";

const router = Router();

// Lead Sources routes (placed before parametric routes)
router.get(
  "/lead-sources",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getAllLeadSourcesController
);

router.post(
  "/lead-sources",
  authenticate,
  authorize("SUPER_ADMIN"),
  createLeadSourceController
);

// Inquiry CRUD routes
router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  createInquiryController
);

router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getAllInquiriesController
);

router.get(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getInquiryByIdController
);

router.put(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  updateInquiryController
);

router.delete(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN"),
  deleteInquiryController
);

// Follow-up and conversion routes
router.post(
  "/:id/follow-up",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  addFollowUpController
);

router.get(
  "/:id/follow-ups",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getFollowUpHistoryController
);

router.post(
  "/:id/convert",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  convertInquiryController
);

export default router;
