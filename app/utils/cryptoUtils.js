const crypto = require('crypto');
const secret_key = crypto.randomBytes(32); // Use a 32-byte random key

const algorithm = 'aes-256-ctr';
const iv = crypto.randomBytes(16);

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, secret_key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex')
  };
};

const decrypt = (hash) => {
  const decipher = crypto.createDecipheriv(algorithm, secret_key, Buffer.from(hash.iv, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

  return decrypted.toString();
};

module.exports = { encrypt, decrypt };
