import { randomUUID } from "crypto";
import { query } from "./db.js";

const queues = { male: [], female: [] };
const waiting = new Map();  // userId -> entry
const rooms = new Map();    // roomId -> { a, b, startedAt, sessionReady }
const userRoom = new Map(); // userId -> roomId

const oppositeOf = (gender) => (gender === "male" ? "female" : "male");

// Removes the user from the waiting list and returns their entry (or null)
const removeFromQueue = (userId) => {
  const entry = waiting.get(userId);
  if (!entry) return null;

  const list = queues[entry.gender];
  const index = list.findIndex((e) => e.userId === userId);
  if (index !== -1) list.splice(index, 1);

  waiting.delete(userId);
  return entry;
};

// ---------- call_sessions ----------

// Resolves to true if saved, false if it failed. Never stops the call.
const saveSessionStart = (roomId, male, female, maleWaitMs, femaleWaitMs) => {
  return query(
    `INSERT INTO call_sessions
       (id, male_user_id, female_user_id, male_wait_ms, female_wait_ms)
     VALUES ($1, $2, $3, $4, $5)`,
    [roomId, male.userId, female.userId, maleWaitMs, femaleWaitMs]
  )
    .then(() => true)
    .catch((error) => {
      console.error("call_sessions insert failed:", error);
      return false;
    });
};

const saveSessionEnd = (room, roomId, reason) => {
  const durationSeconds = Math.round((Date.now() - room.startedAt) / 1000);

  // Wait for the insert first, so the update always finds the row
  room.sessionReady
    .then((ok) => {
      if (!ok) return null;
      return query(
        `UPDATE call_sessions
         SET ended_at = CURRENT_TIMESTAMP,
             duration_seconds = $2,
             ended_reason = $3
         WHERE id = $1`,
        [roomId, durationSeconds, reason]
      );
    })
    .catch((error) => {
      console.error("call_sessions update failed:", error);
    });
};

// ---------- queue_waits ----------

// One row per search. Stores a promise on the entry (true if saved).
const saveWaitStart = (entry) => {
  entry.waitReady = query(
    `INSERT INTO queue_waits (id, user_id, gender, joined_at)
     VALUES ($1, $2, $3, $4)`,
    [entry.waitId, entry.userId, entry.gender, new Date(entry.joinedAt)]
  )
    .then(() => true)
    .catch((error) => {
      console.error("queue_waits insert failed:", error);
      return false;
    });
};

// outcome: matched | cancelled | disconnected
// sessionInfo (matched only): { roomId, sessionReady }
const saveWaitEnd = (entry, outcome, waitMs, sessionInfo = null) => {
  const sessionPromise = sessionInfo
    ? sessionInfo.sessionReady
    : Promise.resolve(false);

  Promise.all([entry.waitReady, sessionPromise])
    .then(([waitSaved, sessionSaved]) => {
      if (!waitSaved) return null;

      return query(
        `UPDATE queue_waits
         SET left_at = CURRENT_TIMESTAMP,
             wait_ms = $2,
             outcome = $3,
             session_id = $4
         WHERE id = $1`,
        [
          entry.waitId,
          waitMs,
          outcome,
          sessionSaved && sessionInfo ? sessionInfo.roomId : null
        ]
      );
    })
    .catch((error) => {
      console.error("queue_waits update failed:", error);
    });
};

// ---------- matching ----------

const createMatch = (arriving, waitingEntry) => {
  waiting.delete(waitingEntry.userId);

  const roomId = randomUUID();
  const now = Date.now();

  const arrivingWaitMs = Math.round(now - arriving.joinedAt);
  const waitingWaitMs = Math.round(now - waitingEntry.joinedAt);

  const arrivingIsMale = arriving.gender === "male";
  const male = arrivingIsMale ? arriving : waitingEntry;
  const female = arrivingIsMale ? waitingEntry : arriving;
  const maleWaitMs = arrivingIsMale ? arrivingWaitMs : waitingWaitMs;
  const femaleWaitMs = arrivingIsMale ? waitingWaitMs : arrivingWaitMs;

  const sessionReady = saveSessionStart(
    roomId,
    male,
    female,
    maleWaitMs,
    femaleWaitMs
  );

  // Close both searches as "matched"
  saveWaitEnd(arriving, "matched", arrivingWaitMs, { roomId, sessionReady });
  saveWaitEnd(waitingEntry, "matched", waitingWaitMs, {
    roomId,
    sessionReady
  });

  rooms.set(roomId, {
    a: arriving,
    b: waitingEntry,
    startedAt: now,
    sessionReady
  });
  userRoom.set(arriving.userId, roomId);
  userRoom.set(waitingEntry.userId, roomId);

  // The person who just arrived starts the video offer (WebRTC)
  arriving.socket.emit("match:found", {
    roomId,
    initiator: true,
    waitedMs: arrivingWaitMs,
    partner: { name: waitingEntry.displayName }
  });

  waitingEntry.socket.emit("match:found", {
    roomId,
    initiator: false,
    waitedMs: waitingWaitMs,
    partner: { name: arriving.displayName }
  });
};

// Everyone this user blocked, or who blocked this user
const getBlockedIds = async (userId) => {
  const result = await query(
    `SELECT blocker_id, blocked_id
     FROM blocks
     WHERE blocker_id = $1 OR blocked_id = $1`,
    [userId]
  );

  const ids = new Set();
  for (const row of result.rows) {
    ids.add(row.blocker_id === userId ? row.blocked_id : row.blocker_id);
  }
  return ids;
};

export const joinQueue = async (socket) => {
  // Re-read the user so a freshly saved profile is respected
  const result = await query(
    `SELECT id, name, display_name, is_disabled,
            gender, is_adult_confirmed
     FROM users
     WHERE id = $1`,
    [socket.user.id]
  );

  const user = result.rows[0];

  if (!user || user.is_disabled) {
    return socket.emit("queue:error", { message: "Account not available" });
  }

  if (user.gender !== "male" && user.gender !== "female") {
    return socket.emit("queue:error", {
      message: "Please set your gender in your profile first"
    });
  }

  if (user.is_adult_confirmed !== true) {
    return socket.emit("queue:error", {
      message: "Please confirm you are 18 or older in your profile"
    });
  }

  const blockedIds = await getBlockedIds(user.id);

  // Checked after the awaits, so a double click cannot add the user twice
  if (waiting.has(user.id) || userRoom.has(user.id)) {
    return socket.emit("queue:error", {
      message: "You are already searching or in a call"
    });
  }

  const entry = {
    socket,
    userId: user.id,
    gender: user.gender,
    displayName: user.display_name || user.name,
    joinedAt: Date.now(),
    waitId: randomUUID(),
    waitReady: Promise.resolve(false)
  };

  // Record the start of this search
  saveWaitStart(entry);

  // Find an opposite-gender person who is connected and not blocked
  const opposite = queues[oppositeOf(user.gender)];
  let partner = null;

  for (let i = 0; i < opposite.length; ) {
    const candidate = opposite[i];

    if (!candidate.socket.connected) {
      opposite.splice(i, 1);
      waiting.delete(candidate.userId);
      saveWaitEnd(
        candidate,
        "disconnected",
        Math.round(Date.now() - candidate.joinedAt)
      );
      continue;
    }

    if (blockedIds.has(candidate.userId)) {
      i++;
      continue;
    }

    partner = candidate;
    opposite.splice(i, 1);
    break;
  }

  if (partner) {
    createMatch(entry, partner);
  } else {
    queues[user.gender].push(entry);
    waiting.set(user.id, entry);
    socket.emit("queue:waiting", { message: "Searching for a match..." });
  }
};

export const leaveQueue = (socket) => {
  const entry = removeFromQueue(socket.user.id);

  if (entry) {
    saveWaitEnd(entry, "cancelled", Math.round(Date.now() - entry.joinedAt));
    socket.emit("queue:left", { message: "Stopped searching" });
  }
};
// Returns the partner's entry only if this user really is in this room
export const getPartnerEntry = (userId, roomId) => {
  if (userRoom.get(userId) !== roomId) return null;

  const room = rooms.get(roomId);
  if (!room) return null;

  return room.a.userId === userId ? room.b : room.a;
};
export const endMatch = (socket) => {
  const userId = socket.user.id;
  const roomId = userRoom.get(userId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  rooms.delete(roomId);

  if (room) {
    userRoom.delete(room.a.userId);
    userRoom.delete(room.b.userId);

    const leaver = room.a.userId === userId ? room.a : room.b;
    const other = room.a.userId === userId ? room.b : room.a;

    saveSessionEnd(room, roomId, `left_by_${leaver.gender}`);
    other.socket.emit("match:ended", { reason: "Partner left" });
  }

  socket.emit("match:ended", { reason: "You left" });
};

export const handleDisconnect = (socket) => {
  const entry = removeFromQueue(socket.user.id);

  if (entry) {
    saveWaitEnd(
      entry,
      "disconnected",
      Math.round(Date.now() - entry.joinedAt)
    );
  }

  const roomId = userRoom.get(socket.user.id);
  if (roomId) {
    const room = rooms.get(roomId);
    rooms.delete(roomId);

    if (room) {
      userRoom.delete(room.a.userId);
      userRoom.delete(room.b.userId);

      const leaver = room.a.userId === socket.user.id ? room.a : room.b;
      const other = room.a.userId === socket.user.id ? room.b : room.a;

      saveSessionEnd(room, roomId, `disconnected_${leaver.gender}`);
      other.socket.emit("match:ended", { reason: "Partner disconnected" });
    }
  }
};

// Returns the partner's socket only if this user really is in this room
export const getPartnerSocket = (userId, roomId) => {
  if (userRoom.get(userId) !== roomId) return null;

  const room = rooms.get(roomId);
  if (!room) return null;

  return room.a.userId === userId ? room.b.socket : room.a.socket;
};