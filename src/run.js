const fs = require('mz/fs');
const exec = require('./exec');

const execPackageCommand = async (packageName, command, args) => {
  if (!(await fs.exists(`${process.cwd()}/src_modules/${packageName}`))) {
    throw new Error(`Source package is not installed: ${packageName}`);
  }

  const config = {
    cwd: `${process.cwd()}/src_modules/${packageName}`,
    env: {
      PATH: [
        `${process.cwd()}/src_modules/${packageName}/node_modules/.bin/`,
        process.env.PATH,
      ].join(':'),
    },
  };

  await exec(command, args, config);
};

const run = async ({ _, sync, all }) => {
  const packageNameArg = _[0];
  const command = _[1];
  const args = _.slice(2);

  const processes = [];
  const packages = [];

  if (sync) {
    processes.push(exec(command, args, { cwd: process.cwd() }));
  }

  if (sync || all) {
    packages.push(...(await fs.readdir(`${process.cwd()}/src_modules`)));
  } else {
    packages.push(packageNameArg);
  }

  processes.push(...packages.map(packageName => execPackageCommand(packageName, command, args)));

  await Promise.all(processes);
};

module.exports = run;
