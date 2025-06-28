/*
  # Fix user registration RLS policy

  1. Security Changes
    - Add policy to allow anonymous users to register (INSERT into users table)
    - This enables the registration functionality while maintaining security for other operations

  2. Policy Details
    - Allows INSERT operations for anonymous (anon) role
    - Required for user registration to work properly
    - Does not affect existing policies for authenticated users
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow public registration" ON users;

-- Create policy to allow anonymous users to register
CREATE POLICY "Allow public registration"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);