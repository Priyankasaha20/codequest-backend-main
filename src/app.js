import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import connectMongo from "connect-mongo";
import cors from "cors";
import passport from "./config/passport.js";
import routes from "./routes/index.js";
import "./config/db.js";

const app = express();
dotenv.config();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5000", process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());

const mongostore = connectMongo.create({
  mongoUrl: process.env.MONGO_URI,
  collectionName: "sessions",
  ttl: 24 * 60 * 60,
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: mongostore,
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

app.use("/api", routes);

export default app;
