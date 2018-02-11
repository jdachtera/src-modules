#!/usr/bin/env node
const fs = require('mz/fs');
const exec = require('./exec');

const execPackageCommand = async (packageName, command, args) => {
  if (!await fs.exists(`${process.cwd()}/src_modules/${packageName}`)) {
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

(async () => {
  const packageNameArg = process.argv[2];
  const command = process.argv[3];
  const args = process.argv.slice(4);

  const processes = [];
  const packages = [];

  if (packageNameArg === '--sync') {
    processes.push(exec(command, args, { cwd: process.cwd() }));
  }

  if (['--all', '--sync'].includes(packageNameArg)) {
    packages.push(...(await fs.readdir(`${process.cwd()}/src_modules`)));
  } else {
    packages.push(packageNameArg);
  }

  processes.push(...packages.map(packageName => execPackageCommand(packageName, command, args)));

  await Promise.all(processes);
})().catch(console.error);
