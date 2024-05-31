const UserService = require("../services/userService");
const ResponseHandler = require("../utils/responseHandler");
const { STATUS_TYPE } = require("../constants/statusCodes");

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
    ResponseHandler.success(res, users);
  }

  async getUserById(req, res) {
    const user = await UserService.getUserById(req.params.id);
    if (user) {
      ResponseHandler.success(res, user);
    } else {
      ResponseHandler.fail(
        res,
        STATUS_TYPE.notFound,
        STATUS_TYPE.internalError,
        "User not found"
      );
    }
  }

  async createUser(req, res) {
    try {
      const { name, email, password, refCode } = req.body;
      const user = await UserService.createUser(name, email, password, refCode);
      ResponseHandler.success(res, user, STATUS_TYPE.created);
    } catch (error) {
      if (error.message === "Email already registered") {
        ResponseHandler.fail(
          res,
          STATUS_TYPE.conflict,
          STATUS_TYPE.otherError,
          error.message
        );
      } else if (error.message === "Your reference code is invalid.") {
        ResponseHandler.fail(
          res,
          STATUS_TYPE.badRequest,
          STATUS_TYPE.otherError,
          error.message
        );
      } else {
        ResponseHandler.fail(
          res,
          STATUS_TYPE.internalServerError,
          STATUS_TYPE.internalError,
          error.message
        );
      }
    }
  }
}
module.exports = new UserController();
