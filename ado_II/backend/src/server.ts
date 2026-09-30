import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { apiRouter } from "./routes/index.js";

const PORT = Number(process.env.PORT ?? 3001);
const isProduction = process.env.NODE_ENV === "production";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: process.env.HTTPS === "true" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: process.env.HTTPS === "true",
  }),
);

const corsOrigins = process.env.CORS_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean);
if (corsOrigins?.length || !isProduction) {
  app.use(
    "/api",
    cors({
      origin: corsOrigins?.length ? corsOrigins : ["http://localhost:4200", "http://127.0.0.1:4200"],
      methods: ["GET", "POST"],
    }),
  );
}


app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    limit: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 1200),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Muitas requisições. Tente novamente em instantes." },
  }),
);

app.use("/api", express.json({ limit: "4kb" }));

app.use("/api", apiRouter);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

app.use(express.static(publicDir, { index: false, maxAge: isProduction ? "1h" : 0 }));
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(path.join(publicDir, "index.html"));
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = typeof err?.status === "number" ? err.status : 500;
  if (status === 400 || status === 413) {
    res.status(status).json({ error: status === 413 ? "Corpo da requisição muito grande" : "JSON inválido" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Erro interno" });
};
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Newton API listening on http://localhost:${PORT}`);
});

server.headersTimeout = 15_000;
server.requestTimeout = 20_000;
