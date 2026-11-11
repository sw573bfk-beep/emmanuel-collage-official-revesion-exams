-- Teacher accounts: a Teacher code (from Beau) turns an account into a teacher. Teachers add students to
-- their class and can see those students' study time and scores (never their messages).
ALTER TABLE users ADD COLUMN teacher INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS teacher_students (
  teacher_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  added_at INTEGER NOT NULL,
  PRIMARY KEY (teacher_id, student_id)
);
CREATE INDEX IF NOT EXISTS teacher_students_student ON teacher_students(student_id);
