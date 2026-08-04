import { loginService } from "./auth.service.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginService(email, password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result.user,
      token: result.token,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
};

export const adminDashboard = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Welcome Super Admin 🚀",
    user: req.user,
  });
};