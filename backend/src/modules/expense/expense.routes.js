import { Router } from "express";
import {
  getExpenses,
  createExpense,
  deleteExpense,
  getExpenseStats,
} from "./expense.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = Router();

router.use(authenticate);
router.use(authorize("SUPER_ADMIN"));

router.get("/", getExpenses);
router.post("/", createExpense);
router.get("/stats", getExpenseStats);
router.delete("/:id", deleteExpense);

export default router;
