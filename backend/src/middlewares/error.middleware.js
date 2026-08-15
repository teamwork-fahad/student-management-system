import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { errorResponse } from "../utils/response.js";

const allowedStatusCodes = [400, 401, 403, 404, 409, 500];

export const notFoundMiddleware = (req, res) => {
  return errorResponse(res, "Route not found", 404);
};

export const errorMiddleware = (error, req, res, next) => {
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const fieldName = firstIssue?.path?.filter(Boolean).join(".");
    let msg = firstIssue?.message;

    if (!msg || msg.startsWith("Invalid input") || msg === "Required") {
      msg = fieldName ? `Invalid value provided for field '${fieldName}'` : "Validation failed";
    }

    return errorResponse(res, msg, 400);
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return errorResponse(res, "Duplicate value already exists", 409);
  }

  const statusCode =
    typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 600
      ? error.statusCode
      : 500;

  const message = error.message || "Internal server error";

  // Log server errors so they are visible in logs
  if (statusCode >= 500) {
    console.error("[SERVER ERROR]", error.message, error.stack);
  }

  return errorResponse(res, message, statusCode);
};
