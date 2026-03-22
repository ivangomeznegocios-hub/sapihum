-- ============================================
-- Migration 022: Add 'ponente' to user_role enum
-- MUST be committed separately before using the new value
-- ============================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ponente';
