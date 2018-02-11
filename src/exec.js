const { spawn } = require('child_process');

const exec = (command, args, options) =>
  new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ['ignore', process.stdout, process.stderr],
      ...options,
    });

    proc.on('close', (code) => {
      if (code) {
        reject(code);
      } else {
        resolve();
      }
    });
  });

module.exports = exec;
