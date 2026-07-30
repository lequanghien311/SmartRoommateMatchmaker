CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('tenant', 'landlord', 'admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked')),
  birth_date DATE,
  gender VARCHAR(20),
  school VARCHAR(160),
  bio VARCHAR(1000),
  avatar_url TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) NOT NULL UNIQUE,
  icon VARCHAR(80),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) >= 20),
  monthly_price NUMERIC(12,2) NOT NULL CHECK (monthly_price > 0),
  deposit NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  area NUMERIC(8,2) NOT NULL CHECK (area > 0),
  address TEXT NOT NULL,
  province VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  ward VARCHAR(100),
  room_type VARCHAR(40) NOT NULL,
  max_occupants INTEGER NOT NULL DEFAULT 1 CHECK (max_occupants > 0),
  available_rooms INTEGER NOT NULL DEFAULT 1 CHECK (available_rooms >= 0),
  has_mezzanine BOOLEAN NOT NULL DEFAULT FALSE,
  allows_pets BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending','active','hidden','rented','rejected','deleted')),
  rejection_reason TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  favorite_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_location ON rooms(province, district);
CREATE INDEX idx_rooms_price ON rooms(monthly_price);
CREATE INDEX idx_rooms_created_at ON rooms(created_at);

CREATE TABLE room_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id),
  storage_key TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_room_cover ON room_images(room_id) WHERE is_cover AND deleted_at IS NULL;

CREATE TABLE room_amenities (
  room_id UUID NOT NULL REFERENCES rooms(id),
  amenity_id UUID NOT NULL REFERENCES amenities(id),
  PRIMARY KEY (room_id, amenity_id)
);

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

CREATE TABLE roommate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  budget_min NUMERIC(12,2) NOT NULL CHECK (budget_min >= 0),
  budget_max NUMERIC(12,2) NOT NULL CHECK (budget_max >= budget_min),
  preferred_province VARCHAR(100) NOT NULL,
  preferred_district VARCHAR(100),
  sleep_time TIME NOT NULL,
  wake_time TIME NOT NULL,
  smoking BOOLEAN NOT NULL DEFAULT FALSE,
  has_pets BOOLEAN NOT NULL DEFAULT FALSE,
  cleanliness SMALLINT NOT NULL CHECK (cleanliness BETWEEN 1 AND 5),
  noise_tolerance SMALLINT NOT NULL CHECK (noise_tolerance BETWEEN 1 AND 5),
  cooking_frequency SMALLINT NOT NULL CHECK (cooking_frequency BETWEEN 1 AND 5),
  preferred_gender VARCHAR(20) DEFAULT 'any',
  school VARCHAR(160),
  habits TEXT,
  is_looking BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE matching_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  candidate_id UUID NOT NULL REFERENCES users(id),
  total_score NUMERIC(5,2) NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  breakdown JSONB NOT NULL,
  similarities JSONB NOT NULL DEFAULT '[]',
  conflicts JSONB NOT NULL DEFAULT '[]',
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, candidate_id)
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id),
  type VARCHAR(20) NOT NULL DEFAULT 'direct' CHECK (type IN ('direct','room')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE conversation_members (
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  content VARCHAR(2000) NOT NULL CHECK (char_length(trim(content)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  reason VARCHAR(40) NOT NULL CHECK (reason IN ('incorrect_info','wrong_price','scam','wrong_images','inappropriate','expired','other')),
  description VARCHAR(1000),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','rejected')),
  admin_note TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reports_status ON reports(status);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80),
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  request_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

