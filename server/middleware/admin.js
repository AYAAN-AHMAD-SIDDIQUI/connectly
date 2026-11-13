import { query } from "../db.js";

// Must run after authenticate. Checks is_admin straight from the database.
export const requireAdmin = async (req, res, next) => {
  try {
    const result = await query(
      "SELECT is_admin FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows[0]?.is_admin !== true) {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin check failed:", error);
    res.status(500).json({ message: "Admin check failed" });
  }
};