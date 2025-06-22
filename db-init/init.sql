CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
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
    CONSTRAINT fk_owner FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS registered(
    email VARCHAR(100) NOT NULL,
    event_id int NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_email FOREIGN KEY(event_id) REFERENCES event(id) ON DELETE CASCADE,
    PRIMARY KEY (email, event_id),
    payment_date TIMESTAMP
);



-- Sett inn demo-data hvis ønskelig
INSERT INTO users (username, email,password) VALUES ('testuser', 'test@example.com', '$2b$10$vTibYh0I1uxlAF5Pv9HQ0uQ7nOP2nfJhrQNiqXfL5qEprVR.1Z9Kq');
INSERT INTO event (name, owner_id,event_date) VALUES ('slingshot', 1, '2025-12-01 18:00:00');
INSERT INTO registered (email, event_id) VALUES ('tomel@gmail.com', 1);