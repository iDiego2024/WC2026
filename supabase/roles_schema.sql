-- SQL Schema Migration: User Roles System (admin/user)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
