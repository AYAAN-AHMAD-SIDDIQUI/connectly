-- =====================================
-- CONNECTLY DATABASE
-- =====================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,

    display_name VARCHAR(50),
    bio VARCHAR(300) DEFAULT '',

    -- NEW: gender matching fields
    gender TEXT CHECK (gender IN ('male', 'female')),
    gender_locked BOOLEAN NOT NULL DEFAULT FALSE,
    is_adult_confirmed BOOLEAN NOT NULL DEFAULT FALSE,

    profile_completed BOOLEAN DEFAULT FALSE,
    is_disabled BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Safe for existing databases: adds the new columns if the table already exists
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS gender TEXT
        CHECK (gender IN ('male', 'female')),
    ADD COLUMN IF NOT EXISTS gender_locked BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_adult_confirmed BOOLEAN NOT NULL DEFAULT FALSE;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_google_id
ON users(google_id);

CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_gender
ON users(gender);

-- BLOCKS TABLE
CREATE TABLE IF NOT EXISTS blocks (
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (blocker_id, blocked_id),

    CHECK (blocker_id <> blocked_id)
);

-- REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    reason VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CHECK (reporter_id <> reported_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_reported_id
ON reports(reported_id);

-- =====================================
-- CONNECTION INVITATIONS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS connection_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sender_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    receiver_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected')),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CHECK (sender_id <> receiver_id)
);

-- Prevent duplicate pending invitations
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_invitation
ON connection_invitations(sender_id, receiver_id)
WHERE status = 'pending';

-- Faster invitation lookups
CREATE INDEX IF NOT EXISTS idx_invitations_receiver
ON connection_invitations(receiver_id, status);

CREATE INDEX IF NOT EXISTS idx_invitations_sender
ON connection_invitations(sender_id, status);

-- =====================================
-- VIDEO CALL SESSIONS
-- =====================================

CREATE TABLE IF NOT EXISTS call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    caller_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    receiver_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    status VARCHAR(20) NOT NULL DEFAULT 'ringing'
        CHECK (
            status IN (
                'ringing',
                'accepted',
                'rejected',
                'ended',
                'missed'
            )
        ),

    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CHECK (caller_id <> receiver_id),
    CHECK (
        ended_at IS NULL
        OR started_at IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_call_sessions_caller
ON call_sessions(caller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_sessions_receiver
ON call_sessions(receiver_id, created_at DESC);