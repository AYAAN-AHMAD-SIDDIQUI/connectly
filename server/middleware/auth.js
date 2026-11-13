import jwt from "jsonwebtoken";
import { query } from "../db.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication token required"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // gender, gender_locked and is_adult_confirmed are needed for
    // opposite-gender matching, so every authenticated request carries them.
    const result = await query(
      `SELECT id, email, name, display_name,
              bio, profile_completed, is_disabled,
              gender, gender_locked, is_adult_confirmed
       FROM users
       WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    const user = result.rows[0];

    if (user.is_disabled) {
      return res.status(403).json({
        message: "Account disabled"
      });
    }

    req.user = user;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};