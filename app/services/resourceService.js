const PortalResourceModel = require('../models/portalResourceModel');
const PortalRoleModel = require('../models/portalRoleModel');
const CustomError = require('../utils/customError');
const { STATUS_TYPE } = require('../utils/statusCodes');

class ResourceService {
  async getAllResources(params = {}) {
    const conditions = {};
    if (params.keyword) {
      conditions.resource_name = { $regex: params.keyword, $options: 'i' };
    }
    const list = await PortalResourceModel.find(conditions).sort({ created_at: -1 }).lean();
    return { list, total: list.length };
  }

  async getResourceTree(params = {}) {
    const conditions = {};
    if (params.keyword) {
      conditions.resource_name = { $regex: params.keyword, $options: 'i' };
    }
    const resources = await PortalResourceModel.find(conditions).lean();
    const tree = this._buildTree(resources);
    return { tree };
  }

  async getResourceById(id) {
    const resource = await PortalResourceModel.findById(id).lean();
    if (!resource) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Resource not found');
    }
    return resource;
  }

  async createResource(data) {
    const resource = new PortalResourceModel(data);
    await resource.save();
    return { _id: resource._id };
  }

  async updateResource(id, data) {
    const resource = await PortalResourceModel.findById(id);
    if (!resource) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Resource not found');
    }
    const fields = [
      'resource_pid',
      'resource_code',
      'resource_type',
      'resource_name',
      'resource_url',
    ];
    fields.forEach((f) => {
      if (data[f] !== undefined) resource[f] = data[f];
    });
    await resource.save();
    return { _id: resource._id };
  }

  async deleteResource(id) {
    const resource = await PortalResourceModel.findById(id);
    if (!resource) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Resource not found');
    }
    // Check if resource is assigned to any role
    const roleCount = await PortalRoleModel.countDocuments({ resource: id });
    if (roleCount > 0) {
      throw new CustomError(
        STATUS_TYPE.HTTP_CONFLICT,
        409,
        'Resource is in use and cannot be deleted',
      );
    }
    await PortalResourceModel.findByIdAndDelete(id);
    return { _id: id };
  }

  _buildTree(resources) {
    const map = {};
    const roots = [];
    resources.forEach((r) => {
      map[r._id.toString()] = { ...r, children: [] };
    });
    resources.forEach((r) => {
      if (r.resource_pid) {
        const parent = map[r.resource_pid.toString()];
        if (parent) {
          parent.children.push(map[r._id.toString()]);
        } else {
          roots.push(map[r._id.toString()]);
        }
      } else {
        roots.push(map[r._id.toString()]);
      }
    });
    return roots;
  }
}

module.exports = new ResourceService();
