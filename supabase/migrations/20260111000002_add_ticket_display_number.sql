-- Migration: Add memorable ticket display numbers
-- Description: Adds date-based sequential ticket numbers (TT-2026-001 format)
-- Date: 2026-01-11

-- Add display_number column
ALTER TABLE tickets 
  ADD COLUMN display_number TEXT UNIQUE;

-- Create sequence table to track counters per year
CREATE TABLE ticket_number_sequences (
  year INTEGER PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Function to generate next ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  current_year INTEGER;
  next_number INTEGER;
  display_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM NOW());
  
  -- Lock row for update to prevent race conditions
  SELECT last_number INTO next_number
  FROM ticket_number_sequences
  WHERE year = current_year
  FOR UPDATE;
  
  -- If year doesn't exist, insert it
  IF NOT FOUND THEN
    INSERT INTO ticket_number_sequences (year, last_number)
    VALUES (current_year, 0)
    ON CONFLICT (year) DO NOTHING;
    next_number := 0;
  END IF;
  
  -- Increment counter
  next_number := next_number + 1;
  
  -- Update sequence
  UPDATE ticket_number_sequences
  SET last_number = next_number
  WHERE year = current_year;
  
  -- Format as TT-YYYY-NNN (zero-padded to 3 digits)
  display_number := 'TT-' || current_year || '-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN display_number;
END;
$$;

-- Trigger to auto-generate display_number on insert
CREATE OR REPLACE FUNCTION set_ticket_display_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate if not already set
  IF NEW.display_number IS NULL THEN
    NEW.display_number := generate_ticket_number();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER ticket_display_number_trigger
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_display_number();

-- Backfill existing tickets (assign sequential numbers by creation date)
DO $$
DECLARE
  ticket_record RECORD;
  current_year INTEGER := NULL;
  counter INTEGER := 0;
BEGIN
  FOR ticket_record IN 
    SELECT id, created_at 
    FROM tickets 
    WHERE display_number IS NULL 
    ORDER BY created_at ASC
  LOOP
    -- Reset counter when year changes
    IF current_year IS NULL OR current_year != EXTRACT(YEAR FROM ticket_record.created_at) THEN
      current_year := EXTRACT(YEAR FROM ticket_record.created_at);
      counter := 0;
      
      -- Initialize sequence for this year
      INSERT INTO ticket_number_sequences (year, last_number)
      VALUES (current_year, 0)
      ON CONFLICT (year) DO NOTHING;
    END IF;
    
    counter := counter + 1;
    
    -- Update ticket with display number
    UPDATE tickets
    SET display_number = 'TT-' || current_year || '-' || LPAD(counter::TEXT, 3, '0')
    WHERE id = ticket_record.id;
    
    -- Update sequence
    UPDATE ticket_number_sequences
    SET last_number = counter
    WHERE year = current_year;
  END LOOP;
END;
$$;

-- Add index for search
CREATE INDEX idx_tickets_display_number ON tickets(display_number);

-- Add comment
COMMENT ON COLUMN tickets.display_number IS 
  'Human-readable ticket number in format TT-YYYY-NNN (e.g., TT-2026-001)';
