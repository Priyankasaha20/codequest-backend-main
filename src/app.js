import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import { DrizzleSessionStore } from "./config/sessionStore.js";
import cors from "cors";
import passport from "./config/passport.js";
import routes from "./routes/index.js";
import "./config/dbMongo.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

const app = express();
dotenv.config();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5000",
      process.env.FRONTEND_URL,
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());

// Use custom Postgres-based session store via DrizzleSessionStore
const pgStore = new DrizzleSessionStore();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: pgStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      ...(process.env.NODE_ENV === "production"
        ? {
            sameSite: "lax",
            domain: process.env.COOKIE_DOMAIN,
          }
        : {}),
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", routes);

export default app;
