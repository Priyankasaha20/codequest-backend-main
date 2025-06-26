import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import connectMongo from "connect-mongo";
import cors from "cors";
import "./config/db.js";
const app = express();
dotenv.config();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
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
      sameSite: "lax",
      domain: process.env.COOKIE_DOMAIN,
    },
  })
);



app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;
