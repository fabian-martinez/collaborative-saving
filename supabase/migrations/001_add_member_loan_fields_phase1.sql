-- Migration: Add member and loan fields for Phase 1
-- Date: 2024-01-15
-- Description: Add fields needed for MemberDetailView functionality

-- Add new fields to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' NOT NULL,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS beneficiary text,
ADD COLUMN IF NOT EXISTS registration_date date DEFAULT CURRENT_DATE;

-- Add new field to loans table
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS term integer NOT NULL DEFAULT 24;
