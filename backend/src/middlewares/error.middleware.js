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

    if (!msg || msg === "Invalid input" || msg === "Required") {
      msg = fieldName ? `Invalid value provided for field: ${fieldName}` : "Validation failed";
    }

    return errorResponse(res, msg, 400);
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return errorResponse(res, "Duplicate value already exists", 409);
  }

  const statusCode = allowedStatusCodes.includes(error.statusCode)
    ? error.statusCode
    : 500;
  const message =
    statusCode === 500 ? "Internal server error" : error.message;

  // Log 500 errors with the real error so it's visible in Vercel/server logs
  if (statusCode === 500) {
    console.error("[ERROR]", error.message, error.stack);
  }

  return errorResponse(res, message, statusCode);
};
