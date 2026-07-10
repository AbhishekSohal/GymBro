-- GymBro Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exercises Master List
CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  muscle_group VARCHAR(100), -- e.g. "lower chest", "upper chest"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workout Templates ("Push Day 2", "Pull Day")
CREATE TABLE IF NOT EXISTS workout_days (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Template mapping (defining exercise order in a workout day)
CREATE TABLE IF NOT EXISTS workout_day_exercises (
  id SERIAL PRIMARY KEY,
  workout_day_id INT REFERENCES workout_days(id) ON DELETE CASCADE,
  exercise_id INT REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INT NOT NULL
);

-- Sessions (logs of actual workouts per date)
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  workout_day_id INT REFERENCES workout_days(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Set entries (logs of actual weights & reps lifted)
CREATE TABLE IF NOT EXISTS set_entries (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id INT REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INT NOT NULL,
  weight NUMERIC(6, 2) NOT NULL, -- e.g. 7.5, 25.0
  reps INT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
