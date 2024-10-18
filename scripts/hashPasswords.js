const bcrypt = require('bcrypt');

async function hashPassword(plainPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    console.log(`Hashed Password: ${hashedPassword}`);
}

// Replace '123' with the actual password you want to hash
hashPassword('123');
