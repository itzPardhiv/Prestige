/**
 * PRESTIGE — Cipher Intelligence System
 * Authentication Architecture Mode
 * 
 * ============================================================================
 * TEMPORARY LOCAL DEVELOPMENT AUTHENTICATION MODE
 * ============================================================================
 * When USE_LOCAL_DEV_AUTH is true:
 * - PRESTIGE runs in local-first development & demo mode using Chrome localStorage.
 * - Passwords are cryptographically hashed using one-way SHA-256 (Web Crypto API).
 * - Plaintext passwords are NEVER stored.
 * - Password reset runs locally without requiring Supabase email infrastructure.
 * - Only 'itzpardhiv@gmail.com' (Pardhiv) is permitted to possess ADMIN role.
 * - Supabase integration and PostgreSQL migration remain fully preserved.
 * 
 * To switch back to Supabase Auth in production, toggle this flag to false.
 */
export const USE_LOCAL_DEV_AUTH = true;
