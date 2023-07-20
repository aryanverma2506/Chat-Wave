import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import morgan from "morgan";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

import cors from "./config/cors.js";
import routes from "./routes/routes.js";
import * as errorController from "./controllers/error-controllers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const allowedOrigins = process.env.CLIENT_URLS?.split(",").map((url) =>
  url.trim()
);

app.use(morgan("dev"));
app.use(cookieParser());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(cors({ origin: allowedOrigins }));

app.use("/api", routes);

app.use(errorController.routeNotFound);
app.use(errorController.errorOccurred);

export default app;
