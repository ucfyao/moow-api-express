const PortalRoleModel = require('../models/portalRoleModel');
const PortalUserModel = require('../models/portalUserModel');
const CustomError = require('../utils/customError');
const { STATUS_TYPE } = require('../utils/statusCodes');

class RoleService {
  async getAllRoles(params = {}) {
    const conditions = {};
    if (params.keyword) {
      conditions.role_name = { $regex: params.keyword, $options: 'i' };
    }
    const list = await PortalRoleModel.find(conditions)
      .select('role_name role_description resource')
      .sort({ created_at: -1 })
      .lean();
    return { list, total: list.length };
  }

  async getRoleDroplist() {
    const roles = await PortalRoleModel.find().select('role_name').lean();
    const list = roles.map((r) => ({ value: r._id, label: r.role_name }));
    return { list };
  }

  async getRoleById(id) {
    const role = await PortalRoleModel.findById(id).lean();
    if (!role) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Role not found');
    }
    return role;
  }

  async createRole(data) {
    const role = new PortalRoleModel(data);
    await role.save();
    return { _id: role._id };
  }

  async updateRole(id, data) {
    const role = await PortalRoleModel.findById(id);
    if (!role) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Role not found');
    }
    if (data.role_name !== undefined) role.role_name = data.role_name;
    if (data.role_description !== undefined) role.role_description = data.role_description;
    if (data.resource !== undefined) role.resource = data.resource;
    await role.save();
    return { _id: role._id };
  }

  async deleteRole(id) {
    const role = await PortalRoleModel.findById(id);
    if (!role) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Role not found');
    }
    // Check if role is assigned to any user
    const userCount = await PortalUserModel.countDocuments({ role: id });
    if (userCount > 0) {
      throw new CustomError(STATUS_TYPE.HTTP_CONFLICT, 409, 'Role is in use and cannot be deleted');
    }
    await PortalRoleModel.findByIdAndDelete(id);
    return { _id: id };
  }
}

module.exports = new RoleService();
