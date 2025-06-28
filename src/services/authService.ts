import { supabase } from './supabaseClient';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  created_at: string;
  last_login: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

class AuthService {
  private currentUser: User | null = null;

  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      // Validate input
      if (!username || !password) {
        return { success: false, error: 'Username and password are required' };
      }

      if (password.length !== 4 || !/^\d{4}$/.test(password)) {
        return { success: false, error: 'Password must be exactly 4 digits' };
      }

      // Find user by username - use maybeSingle() to handle case where user doesn't exist
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (userError) {
        console.error('Database error during login:', userError);
        return { success: false, error: 'Login failed. Please try again.' };
      }

      if (!userData) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, userData.password_hash);
      
      if (!isValidPassword) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      // Set current user
      this.currentUser = {
        id: userData.id,
        username: userData.username,
        created_at: userData.created_at,
        last_login: new Date().toISOString()
      };

      // Store in localStorage
      localStorage.setItem('acemind_user', JSON.stringify(this.currentUser));

      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  async register(username: string, password: string): Promise<AuthResponse> {
    try {
      // Validate input
      if (!username || !password) {
        return { success: false, error: 'Username and password are required' };
      }

      if (username.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters long' };
      }

      if (password.length !== 4 || !/^\d{4}$/.test(password)) {
        return { success: false, error: 'Password must be exactly 4 digits' };
      }

      // Check if username already exists - use maybeSingle() to handle case where user doesn't exist
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (checkError) {
        console.error('Database error during username check:', checkError);
        return { success: false, error: 'Registration failed. Please try again.' };
      }

      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username: username.toLowerCase(),
          password_hash: passwordHash,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error('Registration error:', createError);
        return { success: false, error: 'Registration failed. Please try again.' };
      }

      // Set current user
      this.currentUser = {
        id: newUser.id,
        username: newUser.username,
        created_at: newUser.created_at,
        last_login: newUser.last_login
      };

      // Store in localStorage
      localStorage.setItem('acemind_user', JSON.stringify(this.currentUser));

      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('acemind_user');
  }

  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to get from localStorage
    const storedUser = localStorage.getItem('acemind_user');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        return this.currentUser;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('acemind_user');
      }
    }

    return null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  async validateSession(): Promise<boolean> {
    const user = this.getCurrentUser();
    if (!user) return false;

    try {
      // Verify user still exists in database
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        await this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      await this.logout();
      return false;
    }
  }
}

export const authService = new AuthService();