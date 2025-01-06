const { execSync } = require("child_process");
const { log } = require("./logger");
const { runPowerShellScript } = require("../helpers/systemHelper");
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
module.exports = { configureIIS };
