CREATE TABLE trip_enquiries (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  pickup TEXT NOT NULL,
  destination TEXT NOT NULL,
  travel_date DATE,
  trip_type TEXT NOT NULL DEFAULT 'One way',
  passengers INTEGER NOT NULL DEFAULT 1,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'New',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_trip_enquiries_created_at ON trip_enquiries(created_at DESC);