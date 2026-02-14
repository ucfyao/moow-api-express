const ResourceService = require('../services/resourceService');
const ResponseHandler = require('../utils/responseHandler');

class ResourceController {
  async index(req, res) {
    const data = await ResourceService.getAllResources(req.query);
    return ResponseHandler.success(res, data);
  }

  async tree(req, res) {
    const data = await ResourceService.getResourceTree(req.query);
    return ResponseHandler.success(res, data);
  }

  async show(req, res) {
    const data = await ResourceService.getResourceById(req.params.id);
    return ResponseHandler.success(res, data);
  }

  async create(req, res) {
    const data = await ResourceService.createResource(req.body);
    return ResponseHandler.success(res, data, 201);
  }

  async update(req, res) {
    const data = await ResourceService.updateResource(req.params.id, req.body);
    return ResponseHandler.success(res, data);
  }

  async destroy(req, res) {
    const data = await ResourceService.deleteResource(req.params.id);
    return ResponseHandler.success(res, data);
  }
}

module.exports = new ResourceController();
