const User = require('../models/userModel');

class UserService {
  async getAllUsers() {
    return User.find();
  }

  async getUserById(id) {
    return User.findById(id);
  }

  async createUser(name, email) {
    const user = new User({ name, email });
    return user.save();
  }

  async updateUser(id, name, email) {
    return User.findByIdAndUpdate(id, { name, email }, { new: true });
  }

  async deleteUser(id) {
    return User.findByIdAndDelete(id);
  }
}

module.exports = new UserService();