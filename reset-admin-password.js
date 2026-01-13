import pkg from 'pg';
const { Pool } = pkg;
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import * as dotenv from 'dotenv';

dotenv.config();

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString('hex')}.${salt}`;
}

async function resetAdminPassword() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Connecting to database...');
    
    // Hash the new password
    const newPassword = 'admin123';
    const hashedPassword = await hashPassword(newPassword);
    
    console.log('Resetting password for admin@baco.com...');
    
    // Update the admin user's password
    const result = await pool.query(
      `UPDATE users 
       SET password = $1, updated_at = NOW() 
       WHERE email = $2 
       RETURNING id, email, first_name, last_name, is_admin`,
      [hashedPassword, 'admin@baco.com']
    );
    
    if (result.rows.length === 0) {
      console.log('Admin user not found. Creating admin user...');
      
      // Create the admin user if it doesn't exist
      const createResult = await pool.query(
        `INSERT INTO users (email, password, first_name, last_name, membership_status, is_admin, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, email, first_name, last_name, is_admin`,
        ['admin@baco.com', hashedPassword, 'Admin', 'User', 'active', true]
      );
      
      console.log('✅ Admin user created successfully!');
      console.log('User:', createResult.rows[0]);
    } else {
      console.log('✅ Admin password reset successfully!');
      console.log('User:', result.rows[0]);
    }
    
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@baco.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();

