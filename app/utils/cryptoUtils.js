const fs = require('fs');
const crypto = require('crypto');
const config = require('../../config/index');

const publicKey = fs.readFileSync(config.publicKeyPath, 'utf8');
const privateKey = fs.readFileSync(config.privateKeyPath, 'utf8');

const encrypt = (text) => {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      // padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      // oaepHash: 'sha256',
    },
    Buffer.from(text)
  );

  return encrypted.toString('base64');
};

const decrypt = (encrypted) => {
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      // padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      // oaepHash: 'sha256',
    },
    Buffer.from(encrypted, 'base64')
  );

  return decrypted.toString('utf8');
};

module.exports = { encrypt, decrypt };
