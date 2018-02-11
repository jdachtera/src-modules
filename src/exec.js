const { spawn } = require('child_process');

const exec = (...args) =>
  new Promise((resolve, reject) => {
    const proc = spawn(...args);

    proc.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    proc.stderr.on('data', (data) => {
      process.stderr.write(data);
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
