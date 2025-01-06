const fs = require("fs");
const https = require("https");
const { execSync} = require("child_process");
const path = require("path");
const url = require("url");
const { log } = require("../lib/logger");

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
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function setFolderPermissions(folderPath) {
  try {
    log(
      `Granting write permissions to '${folderPath}' for 'Everyone'...`
    );

    // Check if the folder exists
    if (!require("fs").existsSync(folderPath)) {
      log(`Folder does not exist: ${folderPath}`);
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

    log(
      `Permissions granted successfully for 'Everyone' on '${folderPath}'.`
    );
  } catch (error) {
    log(`Error setting permissions for 'Everyone': ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  isAdmin,
  relaunchAsAdmin,
  ensureDirectoryExists,
  extractArchive,
  runPowerShellScript,
  downloadFile,
  sleep,
  setFolderPermissions,
};
