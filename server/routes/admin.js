import express from "express";
import { query } from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router = express.Router();

// Every route below needs a logged-in admin
router.use(authenticate, requireAdmin);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Latest 100 reports
router.get("/reports", async (req, res) => {
  try {
    const result = await query(
      `SELECT r.id, r.reason, r.created_at,
              r.reporter_id, r.reported_id,
              COALESCE(rep.display_name, rep.name) AS reporter_name,
              COALESCE(rd.display_name, rd.name) AS reported_name,
              rd.email AS reported_email,
              rd.is_disabled AS reported_is_disabled,
              (SELECT COUNT(*)::int FROM reports x
               WHERE x.reported_id = r.reported_id) AS reports_against
       FROM reports r
       JOIN users rep ON rep.id = r.reporter_id
       JOIN users rd ON rd.id = r.reported_id
       ORDER BY r.created_at DESC
       LIMIT 100`
    );

    res.json({ reports: result.rows });
  } catch (error) {
    console.error("Admin reports error:", error);
    res.status(500).json({ message: "Could not load reports" });
  }
});

// Disable or enable a user
router.put("/users/:id/disable", async (req, res) => {
  try {
    const { id } = req.params;
    const { disabled } = req.body;

    if (!UUID_REGEX.test(id) || typeof disabled !== "boolean") {
      return res.status(400).json({ message: "Invalid request" });
    }

    if (id === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot disable your own account" });
    }

    const result = await query(
      `UPDATE users
       SET is_disabled = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, is_disabled`,
      [disabled, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Admin disable error:", error);
    res.status(500).json({ message: "Could not update user" });
  }
});

// Wait-time analytics per gender (finished searches only)
router.get("/analytics", async (req, res) => {
  try {
    const result = await query(
      `SELECT
         gender,
         COUNT(*)::int AS searches,
         (COUNT(*) FILTER (WHERE outcome = 'matched'))::int AS matched,
         (COUNT(*) FILTER (WHERE outcome = 'cancelled'))::int AS cancelled,
         (COUNT(*) FILTER (WHERE outcome = 'disconnected'))::int AS disconnected,
         ROUND(100.0 * COUNT(*) FILTER (WHERE outcome = 'matched') / COUNT(*), 1)::float AS match_rate_pct,
         ROUND(AVG(wait_ms) / 1000.0, 1)::float AS avg_wait_sec
       FROM queue_waits
       WHERE outcome IS NOT NULL
       GROUP BY gender
       ORDER BY gender`
    );

    res.json({ analytics: result.rows });
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({ message: "Could not load analytics" });
  }
});

export default router;