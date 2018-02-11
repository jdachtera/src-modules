#!/usr/bin/env node
const fs = require("mz/fs");
const passthrough = require("./passthrough");

const package = process.argv[3];

const execPackageCommand = async (packageName, command, args) => {
  if (!await fs.exists(process.cwd() + "/src_modules/" + packageName)) {
    throw new Error("Source package is not installed: " + packageName);
  }

  const config = {
    cwd: process.cwd() + "/src_modules/" + packageName,
    env: {
      PATH: [
        process.cwd() + "/src_modules/" + packageName + "/node_modules/.bin/",
        process.env.PATH
      ].join(":")
    }
  };

  await passthrough(command, args, config);
};

(async () => {
  const packageNameArg = process.argv[2];
  const command = process.argv[3];
  const args = process.argv.slice(4);

  if (packageNameArg === "--all") {
    const packages = await fs.readdir(process.cwd() + "/src_modules");
    await Promise.all(
      packages.map(async packageName => {
        await execPackageCommand(packageName, command, args);
      })
    );
  } else {
    await execPackageCommand(packageNameArg, command, args);
  }
})().catch(console.error);
