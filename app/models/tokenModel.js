const mongoose = require('mongoose');

const {Schema} = mongoose;

const PortalTokenSchema = new mongoose.Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'PortalUser' }, // user identifier
    token: { type: String, unique: true, required: true, trim: true }, // Token
    user_ip: { type: String, trim: true }, // User IP
    email: { type: String, trim: true }, // User email
    nick_name: { type: String, trim: true }, // User nick name
    type: { type: String, enum: ['code', 'session'], default: 'session' }, // Token type ['code', 'session'], default: 'session'
    last_access_time: { type: Date, default: Date.now }, // Last Access Time (most recent token verification time)
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    collection: 'portal_tokens', // Explicit collection name
  },
);

const PortalTokenModel = mongoose.model('PortalTokenModel', PortalTokenSchema);
module.exports = PortalTokenModel;
