const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../manager/models/User.js');
const logger = require('./logger').create('SEED_ADMIN');

/**
 * Script para crear el super administrador
 * Ejecutar con: npm run seed:admin
 */

async function createSuperAdmin() {
    try {
        logger.info('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        logger.success('Connected to MongoDB successfully');

        // Verificar si ya existe el super admin
        const existingAdmin = await User.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
        
        if (existingAdmin) {
            logger.info('Super admin already exists', { email: existingAdmin.email });
            return;
        }

        // Crear super administrador
        const superAdmin = new User({
            name: process.env.SUPER_ADMIN_NAME,
            email: process.env.SUPER_ADMIN_EMAIL,
            password: process.env.SUPER_ADMIN_PASSWORD,
            role: 'admin',
            faculty: process.env.SUPER_ADMIN_FACULTY,
            department: process.env.SUPER_ADMIN_DEPARTMENT,
            isActive: true
        });

        const savedUser = await superAdmin.save();
        
        logger.success('Super admin created successfully', {
            name: savedUser.name,
            email: savedUser.email,
            role: savedUser.role,
            loginCredentials: {
                email: savedUser.email,
                passwordEnvVar: 'SUPER_ADMIN_PASSWORD'
            }
        });

    } catch (error) {
        logger.error('Error creating super admin', { error: error.message, stack: error.stack });
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Verificar variables requeridas
const requiredVars = [
    'MONGODB_URI',
    'SUPER_ADMIN_EMAIL',
    'SUPER_ADMIN_PASSWORD', 
    'SUPER_ADMIN_NAME',
    'SUPER_ADMIN_FACULTY',
    'SUPER_ADMIN_DEPARTMENT'
];

const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0) {
    logger.error('Missing environment variables', { missing });
    process.exit(1);
}

logger.info('Creating super admin user...');
createSuperAdmin();