-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS feedbackdb;
USE feedbackdb;

-- Create `teams` table
CREATE TABLE IF NOT EXISTS teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert default team data
INSERT IGNORE INTO teams (name) VALUES
  ('dev'), ('ops'), ('sec'), ('spt');

-- Create `users` table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100),
  passwordHash VARCHAR(255),
  role ENUM('manager', 'employee') NOT NULL,
  teamId INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE SET NULL
);

-- Create `feedback` table
CREATE TABLE IF NOT EXISTS feedback (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employeeId INT NOT NULL,
  managerId INT NOT NULL,
  strengths TEXT,
  improvements TEXT,
  sentiment ENUM('positive', 'neutral', 'negative') NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employeeId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (managerId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create a new schema
CREATE SCHEMA IF NOT EXISTS feedbackdb DEFAULT CHARACTER SET utf8;

-- Create a new app-level user
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'nithin';

-- Grant appropriate permissions to root on `feedbackdb`
GRANT INSERT, CREATE, ALTER, UPDATE, SELECT, REFERENCES
ON feedbackdb.* TO 'root'@'%'
IDENTIFIED BY 'nithin'
WITH GRANT OPTION;
