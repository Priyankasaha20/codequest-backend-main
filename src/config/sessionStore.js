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
        "SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW()",
        [sid]
      );
      if (res.rowCount === 0) return callback(null, null);
      const sess = res.rows[0].sess;
      callback(null, sess);
    } catch (err) {
      callback(err);
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
        `INSERT INTO sessions(sid, sess, expire)
         VALUES($1, $2::json, $3)
         ON CONFLICT (sid) DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire`,
        [sid, data, expire]
      );
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  async destroy(sid, callback) {
    try {
      await pool.query("DELETE FROM sessions WHERE sid = $1", [sid]);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
}
