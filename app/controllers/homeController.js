const { hashidsEncode, hashidsDecode } = require('../utils/hashidsHandler');

class HomeController {
  async index(req, res) {
    res.send('service is live');
  }

  async test(req, res) {
    const x = hashidsEncode(1);
    const y = hashidsDecode(x);
    res.json({ x, y });
  }

  // Route to check the status of the scheduled task
  async checkTask(req, res) {
    // const taskStatus = task.getStatus(); // Returns the status of the scheduled task
    res.json({ status: true });
  }
}
module.exports = new HomeController();
