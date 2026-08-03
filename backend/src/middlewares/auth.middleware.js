import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Token missing
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token missing.",
      });
    }

    // Remove "Bearer "
    const token = authHeader.split(" ")[1];

    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Save logged-in user
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};