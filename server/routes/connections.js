
import express from "express";
import { query } from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Send connection invitation
router.post("/invite", authenticate, async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address"
      });
    }

    const receiverResult = await query(
      `SELECT id
       FROM users
       WHERE LOWER(email) = $1
       AND is_disabled = FALSE`,
      [email]
    );

    // Keep account lookup private
    if (receiverResult.rows.length === 0) {
      return res.status(202).json({
        message: "If this account exists, your invitation can be delivered."
      });
    }

    const receiverId = receiverResult.rows[0].id;

    if (receiverId === req.user.id) {
      return res.status(400).json({
        message: "You cannot invite yourself"
      });
    }

    // Check whether either user has blocked the other
    const blockResult = await query(
      `SELECT 1
       FROM blocks
       WHERE (blocker_id = $1 AND blocked_id = $2)
          OR (blocker_id = $2 AND blocked_id = $1)`,
      [req.user.id, receiverId]
    );

    if (blockResult.rows.length > 0) {
      return res.status(202).json({
        message: "If this account exists, your invitation can be delivered."
      });
    }

    // Do not create duplicate accepted connections
    const existingResult = await query(
      `SELECT id
       FROM connection_invitations
       WHERE status = 'accepted'
       AND (
         (sender_id = $1 AND receiver_id = $2)
         OR
         (sender_id = $2 AND receiver_id = $1)
       )
       LIMIT 1`,
      [req.user.id, receiverId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        message: "You are already connected"
      });
    }

    await query(
      `INSERT INTO connection_invitations
       (sender_id, receiver_id)
       VALUES ($1, $2)
       ON CONFLICT (sender_id, receiver_id)
       WHERE status = 'pending'
       DO NOTHING`,
      [req.user.id, receiverId]
    );

    return res.status(202).json({
      message: "Invitation request processed"
    });

  } catch (error) {
    console.error("Invite error:", error);

    return res.status(500).json({
      message: "Unable to process invitation"
    });
  }
});


// Get incoming and outgoing pending invitations
router.get("/invitations", authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT
         ci.id,
         ci.status,
         ci.created_at,
         CASE
           WHEN ci.sender_id = $1 THEN 'outgoing'
           ELSE 'incoming'
         END AS direction,
         u.id AS user_id,
         u.display_name,
         u.name
       FROM connection_invitations ci
       JOIN users u
         ON u.id = CASE
           WHEN ci.sender_id = $1 THEN ci.receiver_id
           ELSE ci.sender_id
         END
       WHERE (ci.sender_id = $1 OR ci.receiver_id = $1)
       AND ci.status = 'pending'
       AND u.is_disabled = FALSE
       ORDER BY ci.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      total: result.rows.length,
      invitations: result.rows
    });

  } catch (error) {
    console.error("Fetch invitations error:", error);

    return res.status(500).json({
      message: "Unable to fetch invitations"
    });
  }
});


// Accept an incoming invitation
router.put("/invitations/:id/accept", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({
        message: "Invalid invitation ID"
      });
    }

    const result = await query(
      `UPDATE connection_invitations ci
       SET status = 'accepted',
           updated_at = CURRENT_TIMESTAMP
       WHERE ci.id = $1
       AND ci.receiver_id = $2
       AND ci.status = 'pending'
       AND EXISTS (
         SELECT 1
         FROM users u
         WHERE u.id = ci.sender_id
         AND u.is_disabled = FALSE
       )
       AND NOT EXISTS (
         SELECT 1
         FROM blocks b
         WHERE (b.blocker_id = ci.sender_id AND b.blocked_id = ci.receiver_id)
            OR (b.blocker_id = ci.receiver_id AND b.blocked_id = ci.sender_id)
       )
       RETURNING ci.id`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Invitation not found or no longer available"
      });
    }

    return res.json({
      message: "Connection invitation accepted"
    });

  } catch (error) {
    console.error("Accept invitation error:", error);

    return res.status(500).json({
      message: "Unable to accept invitation"
    });
  }
});


// Reject an incoming invitation
router.put("/invitations/:id/reject", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({
        message: "Invalid invitation ID"
      });
    }

    const result = await query(
      `UPDATE connection_invitations
       SET status = 'rejected',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       AND receiver_id = $2
       AND status = 'pending'
       RETURNING id`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Invitation not found or no longer available"
      });
    }

    return res.json({
      message: "Connection invitation rejected"
    });

  } catch (error) {
    console.error("Reject invitation error:", error);

    return res.status(500).json({
      message: "Unable to reject invitation"
    });
  }
});


// Get accepted connections
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT
         ci.id AS connection_id,
         ci.created_at AS connected_at,
         u.id AS user_id,
         u.display_name,
         u.name,
         u.bio
       FROM connection_invitations ci
       JOIN users u
         ON u.id = CASE
           WHEN ci.sender_id = $1 THEN ci.receiver_id
           ELSE ci.sender_id
         END
       WHERE (ci.sender_id = $1 OR ci.receiver_id = $1)
       AND ci.status = 'accepted'
       AND u.is_disabled = FALSE
       AND NOT EXISTS (
         SELECT 1
         FROM blocks b
         WHERE (b.blocker_id = $1 AND b.blocked_id = u.id)
            OR (b.blocker_id = u.id AND b.blocked_id = $1)
       )
       ORDER BY ci.updated_at DESC`,
      [req.user.id]
    );

    return res.json({
      total: result.rows.length,
      connections: result.rows
    });

  } catch (error) {
    console.error("Fetch connections error:", error);

    return res.status(500).json({
      message: "Unable to fetch connections"
    });
  }
});

export default router;
