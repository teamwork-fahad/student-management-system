import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { errorResponse } from "../utils/response.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Access denied. Token missing.", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return errorResponse(res, "Invalid or expired token.", 401);
  }
};
