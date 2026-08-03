import { loginService } from "./auth.service.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await loginService(email, password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: user,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};