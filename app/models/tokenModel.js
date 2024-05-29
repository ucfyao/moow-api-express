const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TokenSchema = new mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "portal_users",
      required: true,
      unique: true,
    }, // user identifier
    token: { type: String, required: true }, // Token
    user_ip: { type: String, required: true, trim: true }, // User IP
    email: { type: String, required: true, trim: true }, // User email
    nick_name: { type: String, required: true, trim: true }, // User nick name
    type: {
      type: String,
      enum: ["code", "session"],
      default: "session",
      required: true,
    }, // Token type ['code', 'session'], default: 'session'
    last_access_time: { type: Date, required: true, default: Date.now }, // Last Access Time (most recent token verification time)
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    collection: "portal_tokens", // Explicit collection name
  }
);

const Token = mongoose.model("Token", TokenSchema);
module.exports = Token;
