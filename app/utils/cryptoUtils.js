const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const publicKeyPath = path.join(__dirname, '../keys/damoon.pub');
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

const privateKeyPath = path.join(__dirname, '../keys/damoon.pem');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

const encrypt = (text) => {
  const encrypted = crypto.publicEncrypt({
    key: publicKey,
    //padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    //oaepHash: 'sha256',
  }, Buffer.from(text));

  return encrypted.toString('base64');
};

const decrypt = (encrypted) => {
  const decrypted = crypto.privateDecrypt({
    key: privateKey,
    //padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    //oaepHash: 'sha256',
  }, Buffer.from(encrypted, 'base64'));

  return decrypted.toString('utf8');
};

module.exports = { encrypt, decrypt };