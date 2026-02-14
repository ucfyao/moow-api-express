const mongoose = require('mongoose');

const PortalRoleSchema = new mongoose.Schema(
  {
    role_name: { type: String, required: true, trim: true },
    role_description: { type: String, trim: true },
    resource: [{ type: mongoose.Schema.Types.ObjectId, ref: 'portal_resource' }],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'portal_roles',
  },
);

module.exports = mongoose.model('portal_role', PortalRoleSchema);
