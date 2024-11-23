const fs = require("fs");
const https = require("https");
const { execSync } = require("child_process");
const path = require("path");
const url = require("url");
const { log } = require("./logger");
const { CONFIGURATION_FILE_PATH, GITHUB_RELEASE_URL, WriteJsonFile} = require("../data/constants");
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
function configureIIS(appName, port, physicalPath, appPoolName) {
  try {
    log("Configuring IIS site and converting folder to application...");
    const command = `
        # Check site existence
        $existingSite = Get-Website | Where-Object { $_.Name -eq ${appName} }

        if ($null -eq $existingSite) {
            # Site not found, create a new site
            Write-Host "Site '${appName}' not found. Creating a new site..."
            New-Website -Name ${appName} -PhysicalPath ${physicalPath} -Port ${port} -Force -ApplicationPool ${appPoolName}
            Write-Host "Site '${appName}' created with PhysicalPath '${physicalPath}' and Port ${port}."
        } else {
            # Site exists
            Write-Host "Site '${appName}' exists."
            
            # Update PhysicalPath if needed
            if ($existingSite.physicalPath -ne $physicalPath) {
                Set-ItemProperty "IIS:\Sites\${appName}" -Name physicalPath -Value $physicalPath
                Write-Host "Updated PhysicalPath to '$physicalPath'."
            }

            # Update Port if needed
            $existingBinding = $existingSite.Bindings.Collection | Where-Object { $_.bindingInformation -like "*:${port}:*" }
            if ($null -eq $existingBinding) {
                $existingSite.Bindings.Collection.Clear()
                New-WebBinding -Name ${appName} -Protocol "http" -Port ${port} -IPAddress "*"
                Write-Host "Updated Port ${port}."
            }

            # Update Application Pool if needed
            if ($existingSite.applicationPool -ne ${appPoolName}) {
                Set-ItemProperty "IIS:\Sites\${appName}" -Name applicationPool -Value ${appPoolName}
                Write-Host "Updated Application Pool to '${appPoolName}'."
            }
        }

        # Restart site
        Start-Website -Name ${appName}
        Write-Host "Site '${appName}' restarted."
        `;
    runPowerShellScript(command);

    log(
      `IIS application '${appName}' configured successfully. Application is available at http://localhost:${port}/swagger`
    );
  } catch (error) {
    log("Error configuring IIS:", error.message);
    process.exit(1);
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

function stopAppPool(appPoolName) {
  try {
    log(`Stopping IIS Application Pool: ${appPoolName}`);
    execSync(`powershell -Command "Stop-WebAppPool -Name '${appPoolName}'"`, {
      stdio: "inherit",
    });
    log(`Application Pool '${appPoolName}' stopped successfully.`);
  } catch (error) {
    log(`Failed to stop Application Pool '${appPoolName}': ${error.message}`);
  }
}

function startAppPool(appPoolName) {
  try {
    log(`Starting IIS Application Pool: ${appPoolName}`);
    execSync(`powershell -Command "Start-WebAppPool -Name '${appPoolName}'"`, {
      stdio: "inherit",
    });
    log(`Application Pool '${appPoolName}' started successfully.`);
  } catch (error) {
    log(`Failed to start Application Pool '${appPoolName}':${error.message}`);
  }
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
function ensureAppPoolExists(appPoolName, username, password) {
  try {
    log(`Checking if IIS Application Pool '${appPoolName}' exists...`);

    // Check if the Application Pool exists
    const result = execSync(
      `powershell -Command "Get-WebAppPoolState -Name '${appPoolName}'"`,
      { stdio: "pipe" }
    );
    log(`Application Pool '${appPoolName}' already exists.`);
  } catch {
    log(`Application Pool '${appPoolName}' does not exist. Creating...`);
    try {
      // Create the Application Pool
      execSync(
        `powershell -Command "New-WebAppPool -Name '${appPoolName}'; Set-ItemProperty IIS:\\AppPools\\${appPoolName} -name processModel.identityType -value SpecificUser; Set-ItemProperty IIS:\\AppPools\\${appPoolName} -name processModel.userName -value '${username}'; Set-ItemProperty IIS:\\AppPools\\${appPoolName} -name processModel.password -value '${password}'"`,
        { stdio: "inherit" }
      );
      log(`Application Pool '${appPoolName}' created successfully.`);
    } catch (error) {
      log(
        `Failed to create Application Pool '${appPoolName}':${error.message}`
      );
      process.exit(1);
    }
  }
}
async function getLatestReleaseUrl() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_RELEASE_URL}latest`;

    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const release = response.data;
    const assets = release.assets;

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

async function deploy(
  appDir,
  appName,
  port,
  useWindowsService,
  version,
  username,
  password
) {
  if (!isAdmin()) {
    relaunchAsAdmin();
  }
  try {
    let res = await getLatestReleaseUrl();

    if (useWindowsService) port = port ?? 5001;
    port = port ?? 5001;
    log(
      `Starting deployment for ${appName} on port ${port}, useWindowsService: ${useWindowsService}`
    );

    const directory = path.join("C:\\inetpub\\wwwroot", appName);
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
      appUrl = `https://github.com/beehexacorp/sql-account-rest-api/releases/download/${version}/sql-account-${version}-win-x64.zip`;
    }

    // Download the application zip
    log("Downloading application...");
    await downloadFile(appUrl, zipPath);

    if (!!useWindowsService && useWindowsService.toString() === "true") {
      // STOP the service before copy files
      try {
        execSync(`sc.exe stop ${appName}`, { stdio: "ignore" });
      } catch (err) {
        log(err);
      }
    } else {
      ensureAppPoolExists(appPoolName, username, password);
      stopAppPool(appPoolName);
    }

    // Extract the downloaded zip file
    extractArchive(zipPath, extractPath);

    if (!!useWindowsService && useWindowsService.toString() === "true") {
      // Configure as a Windows Service
      const exePath = path.join(extractPath, `SqlAccountRestAPI.exe`); // Replace with your actual exe name

      await configureWindowsService(appName, port, exePath, username, password);
      log(
        `Deployment completed successfully. You can start browsing at http://localhost:${port}/swagger`
      );
    } else {
      // Configure IIS
      configureIIS(appName, port, extractPath, appPoolName);
      startAppPool(appPoolName);
      log("Deployment completed successfully.");
    }
    WriteJsonFile(CONFIGURATION_FILE_PATH, {
      PORT: port,
      APP_NAME: appName,
    });
  } catch (error) {
    log(`Error during deployment: ${error.message}`);
    log("Deployment failed. Check the logs for details.");
    process.exit(1);
  }
}

module.exports = { deploy };
