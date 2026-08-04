import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import env from "./config/env.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middlewares/error.middleware.js";
import { successResponse } from "./utils/response.js";

const app = express();

app.use(cors());
app.use(express.json());

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  return successResponse(res, "Student Management System API", {}, 200);
});

app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
