const crypto = require('crypto');

function generatePassword(password) {
    const salt = crypto.randomBytes(32).toString('base64');
    const cryptoPassword = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha512');

    return {
        salt: salt,
        password: cryptoPassword.toString('base64')
    };
}

function comparePassword(password, salt, hash) {
    const cryptoPassword = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha512');
    return cryptoPassword.toString('base64') === hash;
}

module.exports = { generatePassword, comparePassword };