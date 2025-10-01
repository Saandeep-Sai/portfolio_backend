const bcrypt = require('bcryptjs');
const { User } = require('../models');
require('dotenv').config();

const createAdmin = async () => {
  try {
    console.log('Creating admin user...');

    // Get admin details from command line or use defaults
    const username = process.argv[2] || 'admin';
    const email = process.argv[3] || 'admin@saandeep.dev';
    const password = process.argv[4] || 'admin123';

    // Check if admin already exists
    const existingAdmins = await User.find({ email });
    if (existingAdmins.length > 0) {
      console.log('❌ Admin user already exists with this email');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Username: ${username}`);
    console.log(`🔑 Password: ${password}`);
    console.log('');
    console.log('⚠️  Please change the default password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};

createAdmin();