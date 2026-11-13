import express from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

// Generate our own JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Google authentication
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (
      typeof idToken !== "string" ||
      !idToken.trim() ||
      idToken.length > 10000
    ) {
      return res.status(400).json({
        message: "Valid ID token required"
      });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (
      !payload?.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        message: "Google verification failed"
      });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name || "Connectly User";

    // Create or update user
    const result = await query(
      `INSERT INTO users (
        id, google_id, email, name
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (google_id)
      DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, name, display_name,
                bio, profile_completed, is_disabled,
                gender, gender_locked, is_adult_confirmed`,
      [uuidv4(), googleId, email, name]
    );

    const user = result.rows[0];

    if (user.is_disabled) {
      return res.status(403).json({
        message: "Account disabled"
      });
    }

    const token = generateToken(user.id);

    return res.status(200).json({
      message: "Google login successful",
      token,
      user
    });

  } catch (error) {
    console.error("Google login error:", error);

    return res.status(401).json({
      message: "Google authentication failed"
    });
  }
});

// Get logged-in user
router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Update profile
router.put("/profile", authenticate, async (req, res) => {
  try {
    const { displayName, bio, gender, isAdultConfirmed } = req.body;

    if (
      typeof displayName !== "string" ||
      typeof bio !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid profile data"
      });
    }

    const cleanName = displayName.trim();
    const cleanBio = bio.trim();

    if (cleanName.length < 2 || cleanName.length > 50) {
      return res.status(400).json({
        message: "Display name must be 2-50 characters"
      });
    }

    if (cleanBio.length > 300) {
      return res.status(400).json({
        message: "Bio must be under 300 characters"
      });
    }

    // Read the current gender / adult status
    const current = await query(
      `SELECT gender, gender_locked, is_adult_confirmed
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    const existing = current.rows[0];

    if (!existing) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    let newGender = existing.gender;
    let newGenderLocked = existing.gender_locked;
    let newAdultConfirmed = existing.is_adult_confirmed;

    // Gender (optional now, but validated when sent)
    if (gender !== undefined && gender !== null && gender !== "") {
      if (gender !== "male" && gender !== "female") {
        return res.status(400).json({
          message: "Gender must be male or female"
        });
      }

      if (existing.gender_locked) {
        if (gender !== existing.gender) {
          return res.status(403).json({
            message: "Gender cannot be changed once saved"
          });
        }
      } else {
        newGender = gender;
        newGenderLocked = true;
      }
    }

    // 18+ confirmation (optional now, but validated when sent)
    if (isAdultConfirmed !== undefined) {
      if (typeof isAdultConfirmed !== "boolean") {
        return res.status(400).json({
          message: "Invalid age confirmation"
        });
      }

      if (isAdultConfirmed === true) {
        newAdultConfirmed = true;
      }
    }

    const result = await query(
      `UPDATE users
       SET display_name = $1,
           bio = $2,
           gender = $3,
           gender_locked = $4,
           is_adult_confirmed = $5,
           profile_completed = TRUE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, email, name, display_name,
                 bio, profile_completed,
                 gender, gender_locked, is_adult_confirmed`,
      [
        cleanName,
        cleanBio,
        newGender,
        newGenderLocked,
        newAdultConfirmed,
        req.user.id
      ]
    );

    res.json({
      message: "Profile updated",
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Profile update failed"
    });
  }
});

export default router;