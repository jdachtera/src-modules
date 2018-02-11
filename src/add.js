#!/usr/bin/env node

const fs = require("mz/fs");
const rimraf = require("rimraf-promise");
const { get } = require("lodash");
var ngu = require("normalize-git-url");
const passthrough = require("./passthrough");

var NpmApi = require("npm-api");

const workDir = process.cwd();

const getPackageJson = async () =>
  JSON.parse(await fs.readFile(workDir + "/package.json"));

const getRepositoryUrl = async packageName => {
  const packageJson = await getPackageJson();
  const localRepositoryConfig = get(
    packageJson,
    "srcDependencies." + packageName + ".repository"
  );

  if (localRepositoryConfig) {
    return localRepositoryConfig;
  }

  const npm = new NpmApi();
  const repo = npm.repo(packageName);
  const { repository } = await repo.package();

  if (repository.type !== "git") {
    throw new Error("Sorry not a git repository: " + repository);
  }

  return ngu(repository.url);
};

const fetchPackageSrc = async packageName => {
  const repository = await getRepositoryUrl(packageName);

  if (!await fs.exists(workDir + "/src_modules")) {
    await fs.mkdir(workDir + "/src_modules");
  }

  if (!await fs.exists(workDir + "/src_modules/" + packageName)) {
    await passthrough("git", [
      "clone",
      repository.url,
      workDir + "/src_modules/" + packageName
    ]);
  }

  const cwd = workDir + "/src_modules/" + packageName;

  await passthrough("git", ["remote", "set-url", "origin", repository.url], {
    cwd
  });

  await passthrough("git", ["checkout", repository.branch || "master"], {
    cwd
  });

  await passthrough("git", ["pull"], { cwd });

  return repository;
};

const linkPackageSrc = async packageName => {
  await rimraf(workDir + "/node_modules/" + packageName);
  await fs.symlink(
    "../src_modules/" + packageName,
    workDir + "/node_modules/" + packageName
  );
};

const addPackageSrc = async packageName => {
  const repository = await fetchPackageSrc(packageName);
  await linkPackageSrc(packageName);

  return {
    repository
  };
};

(async () => {
  const args = process.argv.slice(2);

  const packageNames = args.length
    ? args
    : Object.keys(get(await getPackageJson(), "srcDependencies", {}));

  const configs = await Promise.all(packageNames.map(addPackageSrc));

  const packageJson = await getPackageJson();

  packageJson.srcDependencies = packageJson.srcDependencies || {};

  packageNames.forEach((packageName, i) => {
    const config = {
      ...(packageJson.srcDependencies[packageName] || {}),
      ...configs[i]
    };

    packageJson.srcDependencies[packageName] = config;
  });

  await fs.writeFile(
    workDir + "/package.json",
    JSON.stringify(packageJson, null, 2)
  );
})().catch(console.error);
