ALTER TABLE history_session
ALTER COLUMN id
ADD GENERATED ALWAYS AS IDENTITY (START WITH 1);