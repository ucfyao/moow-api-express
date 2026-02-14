const mongoose = require('mongoose');

const PortalResourceSchema = new mongoose.Schema(
  {
    resource_pid: { type: mongoose.Schema.Types.ObjectId, default: null },
    resource_code: { type: String, required: true, trim: true },
    resource_type: { type: String, enum: ['group', 'menu', 'interface'], required: true },
    resource_name: { type: String, required: true, trim: true },
    resource_url: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'portal_resources',
  },
);

module.exports = mongoose.model('portal_resource', PortalResourceSchema);
