const { execSync} = require("child_process");
const path = require("path");
const { log } = require("./logger");
const {
  CONFIGURATION_FILE_PATH,
  GITHUB_SQL_ACCOUNT_REST_API_RELEASE_URL,
  SQL_ACCOUNT_REST_API_APPLICATION_NAME,
} = require("../data/constants");
const { writeJsonFile } = require("../helpers/jsonHelper");
const { isAdmin, relaunchAsAdmin, ensureDirectoryExists, setFolderPermissions, downloadFile, extractArchive } = require("../helpers/systemHelper");
const { getLatestReleaseUrl } = require("../helpers/githubHelper");
const { configureIIS, ensureAppPoolExists, stopAppPool, startAppPool } = require("./iisDeployment");
const { configureWindowsService } = require("./windowsServiceDeployment");
const { configureWindowsStartup } = require("./windowsStartupDeployment");
async function deploy(
  appDir,
  appName,
  port,
  deployMethod,
  version,
  username,
  password
) {
  if (!isAdmin()) {
    relaunchAsAdmin();
  }
  try {
    port = deployMethod.toString() === "WindowsStartup" ? 5280 : port ?? 5280;

    log(
      `Starting deployment for ${appName} on port ${port}, deploy method: ${deployMethod}`
    );

    const directory = path.join(appDir, appName);
    const zipPath = path.join(directory, "app.zip");
    const extractPath = directory;
    const appPoolName = `${appName}Pool`;
    const localAppDataPath = path.join(
      process.env.HOMEDRIVE,
      process.env.HOMEPATH,
      "AppData",
      "Local"
    );
    // Ensure the target directory exists
    ensureDirectoryExists(directory);

    // Call the function to grant permissions
    setFolderPermissions(localAppDataPath);
    setFolderPermissions(directory);
    // TODO: get the latest release
    var appUrl = "";
    if (!version) {
      appUrl = await getLatestReleaseUrl();
    } else {
      version = "release-" + version;
      appUrl = `https://github.com/${GITHUB_SQL_ACCOUNT_REST_API_RELEASE_URL}download/${version}/sql-account-${version}-win-x64.zip`;
    }

    // Download the application zip
    log("Downloading application...");
    await downloadFile(appUrl, zipPath);

    if (!!deployMethod && deployMethod.toString() === "WindowsService") {
      // STOP the service before copy files
      try {
        execSync(`sc.exe stop ${appName}`, { stdio: "ignore" });
      } catch (err) {
        log(err);
      }
    } else if (!!deployMethod && deployMethod.toString() === "IIS") {
      ensureAppPoolExists(appPoolName, username, password);
      stopAppPool(appPoolName);
    }

    // Extract the downloaded zip file
    extractArchive(zipPath, extractPath);
    const exePath = path.join(
      extractPath,
      SQL_ACCOUNT_REST_API_APPLICATION_NAME
    );
    if (!!deployMethod && deployMethod.toString() === "WindowsService") {
      // Configure as a Windows Service
       // Replace with your actual exe name

      await configureWindowsService(appName, port, exePath, username, password);
      log(
        `Deployment completed successfully. You can start browsing at http://localhost:${port}/swagger`
      );
    } else if (!!deployMethod && deployMethod.toString() === "WindowsStartup") {
      // Configure as a Windows Startup

      await configureWindowsStartup(exePath);
      log(
        `Deployment completed successfully.`
      );
    } else {
      // Configure IIS
      configureIIS(appName, port, extractPath, appPoolName);
      startAppPool(appPoolName);
      log("Deployment completed successfully.");
    }
    await writeJsonFile(CONFIGURATION_FILE_PATH, {
      PORT: port,
      APP_NAME: appName,
      APP_DIR: appDir.replace(/\\/g, "/"),
      DEPLOYMENT_METHOD: deployMethod,
      APP_POOL_NAME: appPoolName
    });
  } catch (error) {
    log(`Error during deployment: ${error.message}`);
    log("Deployment failed. Check the logs for details.");
    process.exit(1);
  }
}

module.exports = { deploy };
