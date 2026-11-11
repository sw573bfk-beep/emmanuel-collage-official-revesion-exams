-- "Report a mistake" on a question: the question, the site's answer and which question maker made it
ALTER TABLE feedback ADD COLUMN context TEXT;
