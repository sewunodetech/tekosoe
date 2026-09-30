import { readFileSync } from "node:fs";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { errors } from "../../lib/errors";

/**
 * Interactive API documentation. The spec is the single source of truth in
 * docs/openapi.yaml; Swagger UI only fetches and renders it.
 *
 *   GET /api/docs          → Swagger UI
 *   GET /api/openapi.yaml  → raw OpenAPI 3.1 document
 */
const SPEC_PATH = new URL("../../../docs/openapi.yaml", import.meta.url);
const SPEC_URL = "/api/openapi.yaml";

export function createDocsRoutes(): Router {
  const router = Router();

  router.get("/openapi.yaml", (_req, res) => {
    let yaml: string;
    try {
      yaml = readFileSync(SPEC_PATH, "utf8");
    } catch {
      throw errors.notFound("OPENAPI_NOT_FOUND", "docs/openapi.yaml is missing from this deployment");
    }
    res.type("application/yaml").send(yaml);
  });

  // Static assets (swagger-ui.css, swagger-ui-bundle.js, init file) under /api/docs/*.
  router.use("/docs", swaggerUi.serve);

  router.get(
    "/docs",
    swaggerUi.setup(null, {
      explorer: false,
      customSiteTitle: "Tekosoe API",
      swaggerUrl: SPEC_URL,
    }),
  );

  return router;
}
