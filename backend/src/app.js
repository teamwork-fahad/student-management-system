import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import { apiReference } from "@scalar/express-api-reference";
import yaml from "yaml";
import routes from "./routes/index.js";
import env from "./config/env.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middlewares/error.middleware.js";
import { successResponse } from "./utils/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openApiDocs = {
  main: yaml.parse(
    fs.readFileSync(path.resolve(__dirname, "../openapi.yaml"), "utf8")
  ),
  frontend: yaml.parse(
    fs.readFileSync(path.resolve(__dirname, "../openapi.frontend.yaml"), "utf8")
  ),
  mobile: yaml.parse(
    fs.readFileSync(path.resolve(__dirname, "../openapi.mobile.yaml"), "utf8")
  ),
};

const serveSwaggerDocs = (spec, routePath, title) => {
  const yamlPath = `${routePath}/openapi.yaml`;

  app.get(yamlPath, (req, res) => {
    res.setHeader("Content-Type", "application/yaml; charset=utf-8");
    res.send(yaml.stringify(spec));
  });

  app.use(
    routePath,
    swaggerUi.serveFiles(spec, { explorer: true, customSiteTitle: title }),
    swaggerUi.setup(spec, { explorer: true, customSiteTitle: title })
  );
};

const app = express();

// Security HTTP Headers with CSP configuration for API Docs (Scalar & Swagger)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
        scriptSrcElem: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http:", "https:"],
      },
    },
  })
);

// CORS configuration
app.use(cors());

// Strict Request Body Limit to prevent Denial of Service (DoS) attacks
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// General API Rate Limiter (500 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
    statusCode: 429,
  },
});

// Strict Rate Limiter for Authentication / Login Routes (15 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
    statusCode: 429,
  },
});

app.use("/api/v1/auth/login", authLimiter);
app.use("/api", apiLimiter);

app.get("/", (req, res) => {
  return successResponse(res, "Student Management System API", {}, 200);
});

// Modern Scalar UI at /docs
app.use(
  "/docs",
  apiReference({
    spec: {
      content: openApiDocs.main,
    },
    theme: "purple",
    pageTitle: "Student Management System API Reference",
  })
);

serveSwaggerDocs(
  openApiDocs.frontend,
  "/api-docs/frontend",
  "Frontend API Docs"
);
serveSwaggerDocs(openApiDocs.mobile, "/api-docs/mobile", "Mobile API Docs");
serveSwaggerDocs(openApiDocs.main, "/api-docs", "Student Management System API Docs");

app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
