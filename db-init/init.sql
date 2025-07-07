CREATE TYPE field_input_type AS ENUM ('text', 'number', 'select');
CREATE TYPE status_type AS ENUM ('registered', 'approved', 'waitlisted');
CREATE TYPE permission_type AS ENUM ('READ', 'EDIT');
CREATE TYPE permission_place_type AS ENUM ('registrations', 'event_settings', 'accounting', 'reports', 'useradmin');

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owner_id INT NOT NULL,
    event_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_owner FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
    is_payed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS permissions(
    event_id INT NOT NULL REFERENCES event(id),
    user_id INT NOT NULL REFERENCES users(id),
    permission_level permission_type NOT NULL DEFAULT 'READ',
    permission_place permission_place_type NOT NULL,
    PRIMARY KEY (event_id, user_id, permission)
);

-- Ny tabell for billetter til eventet
CREATE TABLE IF NOT EXISTS event_tickets (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  name TEXT, -- f.eks. "Standard", "VIP", "Student"
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS registered(
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    event_id INT NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ticket_id INT REFERENCES event_tickets(id),
    payment_date TIMESTAMP,
    payed_amount REAL DEFAULT 0,
    registration_status status_type DEFAULT 'registered',
    checked_in BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE event_field(
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    field_type field_input_type NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    rekkefoelge INT DEFAULT 0,
    CONSTRAINT unique_event_order UNIQUE (event_id, rekkefoelge)

);

CREATE TABLE IF NOT EXISTS field_options(
  id SERIAL PRIMARY KEY,
  field_id INT REFERENCES event_field(id) ON DELETE CASCADE,
  value TEXT NOT NULL
);


CREATE TABLE event_field_value(
    id SERIAL PRIMARY KEY,
    registration_id INT NOT NULL REFERENCES registered(id) ON DELETE CASCADE,
    event_field_id INT NOT NULL REFERENCES event_field(id) ON DELETE CASCADE,
    value TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS password_reset_token(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL
);


-- Sett inn demo-data hvis ønskelig
INSERT INTO users (username, email,password, firstName, lastName) VALUES ('testuser', 'test@example.com', '$2b$10$vTibYh0I1uxlAF5Pv9HQ0uQ7nOP2nfJhrQNiqXfL5qEprVR.1Z9Kq', "tom", "bendhe");
INSERT INTO event (name, owner_id,event_date, is_payed) VALUES ('slingshot', 1, '2025-12-01 18:00:00', true);
INSERT INTO registered (email, event_id) VALUES ('tomel@gmail.com', 1);