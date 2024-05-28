const Hashids = require('hashids');

function hashidsEncode(id, paddingLen = 8) {
    if (isNaN(id)) return '';
    const hashids = new Hashids('xiaobao', paddingLen, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');
    return hashids.encode(id);
}

function hashidsDecode(str, paddingLen = 8) {
    const hashids = new Hashids('xiaobao', paddingLen, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');
    const [id] = hashids.decode(str);
    return id;
}

module.exports = {
    hashidsEncode,
    hashidsDecode
};
