const UserService = require("../services/userService");
const CustomError = require("../utils/customError");
const ResponseHandler = require("../utils/responseHandler");
const { STATUS_TYPE } = require('../utils/statusCodes');

class UserController {
  // const getUsers = async (req, res) => {
  //   const users = await userService.getAllUsers();
  //   res.success(res, users, STATUS_TYPE.http.ok, STATUS_TYPE.success);
  // };

  // const createUser = async (req, res) => {
  //   const newUser = await userService.createUser(req.body);
  //   res.success(res, newUser, STATUS_TYPE.http.created, STATUS_TYPE.success);
  // };
  async getAllUsers(req, res) {
    const users = await UserService.getAllUsers();
    return ResponseHandler.success(res, users);
  }

  async getUserById(req, res) {
    const user = await UserService.getUserById(req.params.id, req.query);
    return ResponseHandler.success(res, user);
  }

  async updateUser(req, res) {
    const user = await UserService.updateUser(req.params.id, req.body);
    return ResponseHandler.success(res, user);
  }
}
module.exports = new UserController();