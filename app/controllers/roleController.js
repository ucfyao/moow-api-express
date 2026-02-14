const RoleService = require('../services/roleService');
const ResponseHandler = require('../utils/responseHandler');

class RoleController {
  async index(req, res) {
    const data = await RoleService.getAllRoles(req.query);
    return ResponseHandler.success(res, data);
  }

  async droplist(req, res) {
    const data = await RoleService.getRoleDroplist();
    return ResponseHandler.success(res, data);
  }

  async show(req, res) {
    const data = await RoleService.getRoleById(req.params.id);
    return ResponseHandler.success(res, data);
  }

  async create(req, res) {
    const data = await RoleService.createRole(req.body);
    return ResponseHandler.success(res, data, 201);
  }

  async update(req, res) {
    const data = await RoleService.updateRole(req.params.id, req.body);
    return ResponseHandler.success(res, data);
  }

  async destroy(req, res) {
    const data = await RoleService.deleteRole(req.params.id);
    return ResponseHandler.success(res, data);
  }
}

module.exports = new RoleController();
