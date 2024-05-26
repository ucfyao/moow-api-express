const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new mongoose.Schema({
  seq_Id: { type: Number, unique: true }, // unique Id
  nick_name: {type: String, required: true, trim: true},
  email: { type: String, required: true, unique: true, trim: true }, // unique email
  referrer: { type: String, trim: true }, // referrer id
  real_name: { type: String, trim: true }, // real name
  password: { type: String, required: true, trim: true }, // password
  salt: { type: String, required: true, unique: true, trim: true }, // salt
  mobile: { type: String, default: '', trim: true }, // phone number
  instagram: { type: String, default: '', trim: true }, // instagram account
  referral_code: { type: String, trim: true}, // user's own referral code 
  //role: { type: Schema.Types.ObjectId, ref: 'PortalRole', default: [] }, // role resource
  last_LoginTime: { type: Date }, // lastest login time
  vip_time_out_at: { type: Date }, // VIP expire time
  last_login_IP: { type: String, trim: true }, // lastest login IP
  is_activated: { type: Boolean, default: false }, // check user already active
  is_deleted: { type: Boolean, default: false }, // check user already deleted
  XBT: { type: String, default: '0' }, // coin balance
  invite_reward: { type: String, default: '0' }, // invited reward
  invite_total: { type: String, default: '0' } // total invited reward
}, {
  timestamps: true  // auto create createdAt and updatedAt
});

const User = mongoose.model('portal_users', UserSchema);
module.exports = User;
