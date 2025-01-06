const { execSync} = require("child_process");
const { log } = require("./logger");
const { sleep } = require("../helpers/systemHelper");

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
module.exports = { configureWindowsService };
