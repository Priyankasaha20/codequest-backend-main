import session from "express-session";
import { pool } from "./dbPostgres.js";

// Custom session store using Postgres via Drizzle pool
export class DrizzleSessionStore extends session.Store {
  constructor() {
    super();
  }

  async get(sid, callback) {
    try {
      const res = await pool.query(
        "SELECT data FROM sessions WHERE session_id = $1 AND expires_at > NOW()",
        [sid]
      );
      if (res.rowCount === 0) return callback(null, null);
      const sess = res.rows[0].data;
      return callback(null, sess);
    } catch (err) {
      return callback(err);
    }
  }

  async set(sid, sess, callback) {
    try {
      const expire =
        sess.cookie && sess.cookie.expires
          ? new Date(sess.cookie.expires)
          : new Date(Date.now() + 24 * 60 * 60 * 1000);
      const data = JSON.stringify(sess);
      await pool.query(
        `INSERT INTO sessions(session_id, data, expires_at)
         VALUES($1, $2::json, $3)
         ON CONFLICT (session_id) DO UPDATE SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at`,
        [sid, data, expire]
      );
      return callback(null);
    } catch (err) {
      return callback(err);
    }
  }

  async destroy(sid, callback) {
    try {
      await pool.query("DELETE FROM sessions WHERE session_id = $1", [sid]);
      return callback(null);
    } catch (err) {
      return callback(err);
    }
  }
}
