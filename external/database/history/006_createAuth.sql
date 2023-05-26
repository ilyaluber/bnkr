CREATE TABLE IF NOT EXISTS auth (
  id BIGINT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alive BOOLEAN NOT NULL DEFAULT TRUE,
  score INTEGER NOT NULL DEFAULT 0,
  login VARCHAR (64) NOT NULL,
  code VARCHAR (32) NOT NULL,
  CONSTRAINT pkey_auth_id PRIMARY KEY (id),
  CONSTRAINT ckey_auth_score CHECK (score >= 0)
);

CREATE SEQUENCE IF NOT EXISTS seq_auth_id INCREMENT 1 START 1 MINVALUE 1;

CREATE INDEX IF NOT EXISTS ind_auth_date ON auth USING BTREE (date);

CREATE INDEX IF NOT EXISTS ind_auth_alive ON auth USING BTREE (alive);

CREATE INDEX IF NOT EXISTS ind_auth_login ON auth USING BTREE (login);

CREATE INDEX IF NOT EXISTS ind_auth_code ON auth USING BTREE (code);