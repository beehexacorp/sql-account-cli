const fs = require("fs");
const https = require("https");
const { execSync } = require("child_process");
const path = require("path");
const url = require("url");
const { log } = require("./logger");
const {
  CONFIGURATION_FILE_PATH,
  GITHUB_SQL_ACCOUNT_REST_API_MONITOR_RELEASE_URL,
  SQL_ACCOUNT_REST_API_MONITOR_APPLICATION_NAME,
  WriteJsonFile,
} = require("../data/constants");
const { exit } = require("process");
const axios = require("axios");

// Check if the script is running as admin
function isAdmin() {
  try {
    // Running a system command that requires admin rights
    execSync("fsutil dirty query %systemdrive%", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Relaunch the script with admin privileges
function relaunchAsAdmin() {
  const args = process.argv
    .slice(1)
    .map((arg) => `"${arg}"`)
    .join(" ");
  const scriptPath = process.argv[1];
  const command = `
        Start-Process cmd.exe -ArgumentList '/k node "${scriptPath}" ${args}' -Verb RunAs
    `;

  log("Re-launching script with administrator privileges...");
  try {
    execSync(`powershell.exe -Command "${command}"`, { stdio: "ignore" });
  } catch (error) {
    log("Failed to re-launch script as administrator:", error.message);
    process.exit(1);
  }
  process.exit(0);
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function extractArchive(zipPath, extractPath) {
  try {
    log("Extracting archive...");
    execSync(
      `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractPath}' -Force"`,
      { stdio: "inherit" }
    );
    log("Archive extracted successfully.");
  } catch (error) {
    log("Error extracting archive:", error.message);
    process.exit(1);
  }
}

function runPowerShellScript(commands, scriptName = "temp.ps1") {
  const scriptPath = path.resolve(__dirname, scriptName);
  fs.writeFileSync(scriptPath, commands);

  try {
    execSync(
      `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`,
      { stdio: "inherit" }
    );
  } finally {
    fs.unlinkSync(scriptPath); // Clean up the script file
  }
}

function downloadFile(fileUrl, outputPath) {
  return new Promise((resolve, reject) => {
    const handleResponse = (response) => {
      if (response.statusCode === 200) {
        // Write the response to the file
        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close(resolve);
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        const redirectedUrl = response.headers.location;
        log(`Redirecting to ${redirectedUrl}`);
        downloadFile(redirectedUrl, outputPath).then(resolve).catch(reject);
      } else {
        reject(
          new Error(
            `Failed to get '${fileUrl}' (Status code: ${response.statusCode})`
          )
        );
      }
    };

    const parsedUrl = url.parse(fileUrl);
    https.get(parsedUrl, handleResponse).on("error", (err) => {
      fs.unlink(outputPath, () => reject(err)); // Clean up any partial file
    });
  });
}

async function configureWindowsService(
  appName,
  port,
  exePath,
  username,
  password
) {
  try {
    // Ensure service is fully deleted
    return ensureServiceExistsOrUpdate(
      appName,
      port,
      exePath,
      username,
      password
    );
  } catch (error) {
    log("Error configuring Windows Service:", error.message);
    process.exit(1);
  }
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureServiceExistsOrUpdate(
  appName,
  port,
  exePath,
  username,
  password
) {
  const exeName = exePath.split("\\").pop(); // Extract the executable name from the path

  try {
    log(`Checking if the service '${appName}' exists...`);

    // Check if the service exists
    try {
      execSync(`sc.exe query ${appName}`, { stdio: "ignore" });
      log(`Service '${appName}' exists. Updating and restarting...`);

      // Kill the associated process if running
      try {
        log(`Attempting to kill process: ${exeName}`);
        execSync(`taskkill /IM ${exeName} /F`, { stdio: "ignore" });
        log(`Process '${exeName}' terminated.`);
      } catch (error) {
        log(`No running process found for '${exeName}'.`);
      }

      // Update the service binary path
      let command = `sc.exe config ${appName} binPath= "${exePath} ${port}" start= auto`;
      if (username && password)
        command += ` obj= "${username}" password= "${password}"`;
      execSync(command, { stdio: "inherit" });
      log(`Service '${appName}' updated successfully.`);
    } catch {
      log(`Service '${appName}' does not exist. Creating and starting it...`);

      // Create the service
      let command = `sc.exe create ${appName} binPath= "${exePath} ${port}" start= auto`;
      if (username && password)
        command += ` obj= "${username}" password= "${password}"`;
      execSync(command, { stdio: "inherit" });
      log(`Service '${appName}' created successfully.`);
    }

    await sleep(2000); // Wait for the service to stop

    // Restart the service
    try {
      execSync(`sc.exe stop ${appName}`, { stdio: "ignore" });
    } catch (err) {
      log(err);
    }
    await sleep(2000); // Wait for the service to stop
    try {
      execSync(`sc.exe start ${appName}`, { stdio: "inherit" });
      log(`Service '${appName}' restarted successfully.`);
    } catch (err) {
      log(err);
    }
  } catch (error) {
    log("Error configuring Windows Service:", error.message);
    process.exit(1);
  }
}

function setFolderPermissions(folderPath) {
  try {
    console.log(
      `Granting write permissions to '${folderPath}' for 'Everyone'...`
    );

    // Check if the folder exists
    if (!require("fs").existsSync(folderPath)) {
      console.error(`Folder does not exist: ${folderPath}`);
      process.exit(1);
    }

    // Ensure the path is properly escaped for the command
    const escapedPath = folderPath.replace(/\\/g, "\\\\");

    // Build the icacls command
    const grantPermissionsCommand = `
            icacls "${escapedPath}" /grant Everyone:(OI)(CI)M /T
        `;

    // Execute the command
    execSync(grantPermissionsCommand, { stdio: "inherit" });

    console.log(
      `Permissions granted successfully for 'Everyone' on '${folderPath}'.`
    );
  } catch (error) {
    console.error(`Error setting permissions for 'Everyone': ${error.message}`);
    process.exit(1);
  }
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
async function getLatestReleaseUrl() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_SQL_ACCOUNT_REST_API_MONITOR_RELEASE_URL}latest`;
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const release = response.data;
    const assets = release.assets;
    WriteJsonFile(CONFIGURATION_FILE_PATH, {
      API_MONITOR_VERSION: release.tag_name,
    });
    const zipAsset = assets.find((asset) => asset.name.endsWith("win-x64.zip"));

    if (zipAsset) {
      return (downloadUrl = zipAsset.browser_download_url);
    } else {
      return null;
    }
  } catch (error) {
    log("Error fetching release:", error);
  }
}

async function monitor(appDir, appName, port) {
  if (!isAdmin()) {
    relaunchAsAdmin();
  }
  try {
    let res = await getLatestReleaseUrl();

    port = port ?? 5002;
    log(`Starting deployment for ${appName} on port ${port}`);

    const directory = path.join(appDir, appName);
    const zipPath = path.join(directory, "app.zip");
    const extractPath = directory;
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
    appUrl = await getLatestReleaseUrl();

    // Download the application zip
    log("Downloading application...");
    await downloadFile(appUrl, zipPath);

    // STOP the service before copy files
    try {
      execSync(`sc.exe stop ${appName}`, { stdio: "ignore" });
    } catch (err) {
      log(err);
    }

    // Extract the downloaded zip file
    extractArchive(zipPath, extractPath);

    // Configure as a Windows Service
    const exePath = path.join(
      extractPath,
      SQL_ACCOUNT_REST_API_MONITOR_APPLICATION_NAME
    ); // Replace with your actual exe name

    await configureWindowsService(appName, port, exePath, username, password);
    log(
      `Deployment completed successfully. You can start browsing at http://localhost:${port}/swagger`
    );

    await WriteJsonFile(CONFIGURATION_FILE_PATH, {
      MONITOR_PORT: port,
      MONITOR_APP_NAME: appName,
    });
  } catch (error) {
    log(`Error during deployment: ${error.message}`);
    log("Deployment failed. Check the logs for details.");
    process.exit(1);
  }
}

module.exports = { monitor, downloadFile };
