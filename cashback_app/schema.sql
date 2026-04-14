CREATE TABLE IF NOT EXISTS consultations (
  id SERIAL PRIMARY KEY,
  client_ip VARCHAR(45) NOT NULL,
  client_type VARCHAR(20) NOT NULL,
  original_amount NUMERIC(10, 2) NOT NULL,
  discount_percent NUMERIC(5, 2) NOT NULL,
  final_amount NUMERIC(10, 2) NOT NULL,
  cashback NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_client_ip ON consultations(client_ip);
