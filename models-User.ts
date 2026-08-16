import { query } from '../config/database.js';
import bcrypt from 'bcrypt';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'player' | 'dealer' | 'admin';
  balance: number;
  total_earned: number;
  location_lat?: number;
  location_lng?: number;
  created_at: Date;
}

export class UserModel {
  static async create(data: {
    email: string;
    username: string;
    password: string;
    role?: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const result = await query(
      `INSERT INTO users (email, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, role, balance, total_earned, created_at`,
      [data.email, data.username, hashedPassword, data.role || 'player']
    );
    
    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT id, email, username, role, balance, total_earned, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async updateBalance(userId: string, amount: number): Promise<void> {
    await query(
      `UPDATE users 
       SET balance = balance + $1, 
           total_earned = total_earned + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [amount, userId]
    );
  }

  static async updateLocation(userId: string, lat: number, lng: number): Promise<void> {
    await query(
      `UPDATE users 
       SET location_lat = $1, location_lng = $2, updated_at = NOW()
       WHERE id = $3`,
      [lat, lng, userId]
    );
  }
}
