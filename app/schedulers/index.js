const fs = require('fs');
const path = require('path');

// 1/*  *  *  *  *  *
// ┬ ┬ ┬ ┬ ┬ ┬
// │ │ │ │ │ |
// │ │ │ │ │ └ day of week (0 - 7) (0 or 7 is Sun)
// │ │ │ │ └── month (1 - 12)
// │ │ │ └──── day of month (1 - 31)
// │ │ └────── hour (0 - 23)
// │ └──────── minute (0 - 59)
// └────────── second (0 - 59, OPTIONAL)

const initializeSchedulers = () => {
  const schedulersPath = path.join(__dirname);

  // Read all files in the current folder
  fs.readdirSync(schedulersPath).forEach((file) => {
    // Exclude index.js file itself
    if (file !== 'index.js' && file.endsWith('Scheduler.js')) {
      const scheduler = require(path.join(schedulersPath, file));
      // If the file exports a function, call it
      if (typeof scheduler === 'function') {
        scheduler();
      }
    }
  });
};

module.exports = initializeSchedulers;
