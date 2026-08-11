import { Router } from "express";
import { getSyncExportDataController, importInternshipStudentsController, mergeInternshipCoursesController } from "./sync.controller.js";

const router = Router();

// GET /api/v1/sync/export - Google Sheets / External Live Sync Endpoint
router.get("/export", getSyncExportDataController);

// POST /api/v1/sync/import-internship - Trigger Internship 2025 Student Import & Mapping
router.post("/import-internship", importInternshipStudentsController);
router.get("/import-internship", importInternshipStudentsController);

// POST /api/v1/sync/merge-internship-courses - Trigger Merger of Internship Courses
router.post("/merge-internship-courses", mergeInternshipCoursesController);
router.get("/merge-internship-courses", mergeInternshipCoursesController);

export default router;


