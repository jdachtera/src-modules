const fs = require('mz/fs');
const rimraf = require('rmfr');
const { get } = require('lodash');
const ngu = require('normalize-git-url');
const exec = require('./exec');

const NpmApi = require('npm-api');

const workDir = process.cwd();

const getPackageJson = async () => JSON.parse(await fs.readFile(`${workDir}/package.json`));

const getRepositoryUrl = async (packageName) => {
  const packageJson = await getPackageJson();
  const localRepositoryConfig = get(packageJson, `srcDependencies.${packageName}.repository`);

  if (localRepositoryConfig) {
    return localRepositoryConfig;
  }

  const npm = new NpmApi();
  const repo = npm.repo(packageName);
  const { repository } = await repo.package();

  if (repository.type !== 'git') {
    throw new Error(`Sorry not a git repository: ${repository}`);
  }

  return ngu(repository.url);
};

const fetchPackageSrc = async (packageName) => {
  const repository = await getRepositoryUrl(packageName);

  if (!(await fs.exists(`${workDir}/src_modules`))) {
    await fs.mkdir(`${workDir}/src_modules`);
  }

  if (!(await fs.exists(`${workDir}/src_modules/${packageName}`))) {
    await exec('git', ['clone', repository.url, `${workDir}/src_modules/${packageName}`]);
  }

  const cwd = `${workDir}/src_modules/${packageName}`;

  await exec('git', ['remote', 'set-url', 'origin', repository.url], {
    cwd,
  });

  await exec('git', ['checkout', repository.branch || 'master'], {
    cwd,
  });

  await exec('git', ['pull'], { cwd });

  await exec('yarn', [], { cwd });

  return repository;
};

const linkPackageSrc = async (packageName) => {
  await rimraf(`${workDir}/node_modules/${packageName}`);
  await fs.symlink(`../src_modules/${packageName}`, `${workDir}/node_modules/${packageName}`);
};

const addPackageSrc = async (packageName) => {
  const repository = await fetchPackageSrc(packageName);
  await linkPackageSrc(packageName);

  return {
    repository,
  };
};

const addSourcePackage = async ({ _ }) => {
  const packageNames = _.length
    ? _
    : Object.keys(get(await getPackageJson(), 'srcDependencies', {}));

  const configs = await Promise.all(packageNames.map(addPackageSrc));

  const packageJson = await getPackageJson();

  packageJson.srcDependencies = packageJson.srcDependencies || {};

  packageNames.forEach((packageName, i) => {
    const config = {
      ...(packageJson.srcDependencies[packageName] || {}),
      ...configs[i],
    };

    packageJson.srcDependencies[packageName] = config;
  });

  await fs.writeFile(`${workDir}/package.json`, JSON.stringify(packageJson, null, 2));
};

module.exports = addSourcePackage;
