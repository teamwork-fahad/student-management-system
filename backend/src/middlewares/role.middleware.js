import { errorResponse } from "../utils/response.js";

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Unauthorized", 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        "Access denied. Insufficient permissions.",
        403
      );
    }

    next();
  };
};
