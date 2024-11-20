const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
const path = require('path');
const url = require('url');
const { log } = require('./logger');
// Check if the script is running as admin
function isAdmin() {
    try {
        // Running a system command that requires admin rights
        execSync('fsutil dirty query %systemdrive%', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

// Relaunch the script with admin privileges
function relaunchAsAdmin() {
    const args = process.argv.slice(1).map(arg => `"${arg}"`).join(' ');
    const scriptPath = process.argv[1];
    const command = `
        Start-Process cmd.exe -ArgumentList '/k node "${scriptPath}" ${args}' -Verb RunAs
    `;

    log('Re-launching script with administrator privileges...');
    try {
        execSync(`powershell.exe -Command "${command}"`, { stdio: 'ignore' });
    } catch (error) {
        log('Failed to re-launch script as administrator:', error.message);
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
        log('Extracting archive...');
        execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractPath}' -Force"`, { stdio: 'inherit' });
        log('Archive extracted successfully.');
    } catch (error) {
        log('Error extracting archive:', error.message);
        process.exit(1);
    }
}

function runPowerShellScript(commands, scriptName = 'temp.ps1') {
    const scriptPath = path.resolve(__dirname, scriptName);
    fs.writeFileSync(scriptPath, commands);

    try {
        execSync(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`, { stdio: 'inherit' });
    } finally {
        fs.unlinkSync(scriptPath); // Clean up the script file
    }
}
function configureIIS(appName, port, physicalPath, appPoolName) {
    try {
        log('Configuring IIS site and converting folder to application...');

        const command = `
            Import-Module WebAdministration;

            # Ensure the Application Pool exists
            if (!(Test-Path IIS:\\AppPools\\${appPoolName})) {
                New-WebAppPool -Name '${appPoolName}';
                Write-Host "Application Pool '${appPoolName}' created.";
            }

            # Ensure the Default Web Site exists
            if (!(Test-Path IIS:\\Sites\\'Default Web Site')) {
                Write-Host "Default Web Site does not exist. Exiting.";
                exit 1;
            }

            # Check if the IIS application exists by matching Path
            $existingApp = Get-WebApplication -Site 'Default Web Site' | Where-Object { $_.Path -eq '/${appName}' };
            if (-not $existingApp -or $existingApp.Count -eq 0 -or $existingApp -eq '') {
                # Remove any existing virtual directory with the same name
                if (Test-Path IIS:\\Sites\\'Default Web Site'\\${appName}) {
                    Remove-WebApplication -Site 'Default Web Site' -Name '${appName}';
                    Write-Host "Removed existing virtual directory '${appName}' to ensure clean conversion.";
                }

                # Create the IIS application
                New-WebApplication -Site 'Default Web Site' -Name '${appName}' -PhysicalPath '${physicalPath}' -ApplicationPool '${appPoolName}';
                Write-Host "Folder '${physicalPath}' converted to IIS application '${appName}'.";
    
            } else {
                Write-Host "IIS application '${appName}' already exists. Updating bindings.";
                Set-ItemProperty IIS:\\Sites\\'Default Web Site'\\${appName} -Name applicationPool -Value '${appPoolName}';
                Write-Host "Application Pool updated for existing IIS application '${appName}'.";
            }
        `;
        log(command)
        runPowerShellScript(command);

        log(`IIS application '${appName}' configured successfully. Application is available at http://localhost/${appName}/swagger`);
    } catch (error) {
        log('Error configuring IIS:', error.message);
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
                fileStream.on('finish', () => {
                    fileStream.close(resolve);
                });
            } else if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                const redirectedUrl = response.headers.location;
                log(`Redirecting to ${redirectedUrl}`);
                downloadFile(redirectedUrl, outputPath).then(resolve).catch(reject);
            } else {
                reject(new Error(`Failed to get '${fileUrl}' (Status code: ${response.statusCode})`));
            }
        };

        const parsedUrl = url.parse(fileUrl);
        https.get(parsedUrl, handleResponse).on('error', (err) => {
            fs.unlink(outputPath, () => reject(err)); // Clean up any partial file
        });
    });
}

async function configureWindowsService(appName, port, exePath) {
    try {
        // Ensure service is fully deleted
        return ensureServiceExistsOrUpdate(appName, port, exePath)

    } catch (error) {
        log('Error configuring Windows Service:', error.message);
        process.exit(1);
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


async function ensureServiceExistsOrUpdate(appName, port, exePath) {
    const exeName = exePath.split('\\').pop(); // Extract the executable name from the path

    try {
        log(`Checking if the service '${appName}' exists...`);

        // Check if the service exists
        try {
            execSync(`sc.exe query ${appName}`, { stdio: 'ignore' });
            log(`Service '${appName}' exists. Updating and restarting...`);

            // Kill the associated process if running
            try {
                log(`Attempting to kill process: ${exeName}`);
                execSync(`taskkill /IM ${exeName} /F`, { stdio: 'ignore' });
                log(`Process '${exeName}' terminated.`);
            } catch (error) {
                log(`No running process found for '${exeName}'.`);
            }

            // Update the service binary path
            execSync(`sc.exe config ${appName} binPath= "${exePath} ${port}"`, { stdio: 'inherit' });
            log(`Service '${appName}' updated successfully.`);
        } catch {
            log(`Service '${appName}' does not exist. Creating and starting it...`);

            // Create the service
            execSync(`sc.exe create ${appName} binPath= "${exePath} ${port}" start= auto`, { stdio: 'inherit' });
            log(`Service '${appName}' created successfully.`);
        }

        await sleep(2000); // Wait for the service to stop

        // Restart the service
        try {
            execSync(`sc.exe stop ${appName}`, { stdio: 'ignore' });
        } catch (err) {
            log(err);
        }
        await sleep(2000); // Wait for the service to stop
        try {
            execSync(`sc.exe start ${appName}`, { stdio: 'inherit' });
            log(`Service '${appName}' restarted successfully.`);
        } catch (err) {
            log(err);
        }
    } catch (error) {
        log('Error configuring Windows Service:', error.message);
        process.exit(1);
    }
}

function setFolderPermissions(folderPath) {
    try {
        console.log(`Granting write permissions to '${folderPath}' for 'Everyone'...`);

        // Check if the folder exists
        if (!require('fs').existsSync(folderPath)) {
            console.error(`Folder does not exist: ${folderPath}`);
            process.exit(1);
        }

        // Ensure the path is properly escaped for the command
        const escapedPath = folderPath.replace(/\\/g, '\\\\');

        // Build the icacls command
        const grantPermissionsCommand = `
            icacls "${escapedPath}" /grant Everyone:(OI)(CI)M /T
        `;

        // Execute the command
        execSync(grantPermissionsCommand, { stdio: 'inherit' });

        console.log(`Permissions granted successfully for 'Everyone' on '${folderPath}'.`);
    } catch (error) {
        console.error(`Error setting permissions for 'Everyone': ${error.message}`);
        process.exit(1);
    }
}

function stopAppPool(appPoolName) {
    try {
        log(`Stopping IIS Application Pool: ${appPoolName}`);
        execSync(`powershell -Command "Stop-WebAppPool -Name '${appPoolName}'"`, { stdio: 'inherit' });
        log(`Application Pool '${appPoolName}' stopped successfully.`);
    } catch (error) {
        log(`Failed to stop Application Pool '${appPoolName}': ${error.message}`);
    }
}

function startAppPool(appPoolName) {
    try {
        log(`Starting IIS Application Pool: ${appPoolName}`);
        execSync(`powershell -Command "Start-WebAppPool -Name '${appPoolName}'"`, { stdio: 'inherit' });
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
function ensureAppPoolExists(appPoolName) {
    try {
        log(`Checking if IIS Application Pool '${appPoolName}' exists...`);

        // Check if the Application Pool exists
        const result = execSync(`powershell -Command "Get-WebAppPoolState -Name '${appPoolName}'"`, { stdio: 'pipe' });
        log(`Application Pool '${appPoolName}' already exists.`);
    } catch {
        log(`Application Pool '${appPoolName}' does not exist. Creating...`);
        try {
            // Create the Application Pool
            execSync(`powershell -Command "New-WebAppPool -Name '${appPoolName}'"`, { stdio: 'inherit' });
            log(`Application Pool '${appPoolName}' created successfully.`);
        } catch (error) {
            log(`Failed to create Application Pool '${appPoolName}':${error.message}`);
            process.exit(1);
        }
    }
}

async function deploy(appName, port, useWindowsService) {
    if (!isAdmin()) {
        relaunchAsAdmin();
    }
    try {
        log(`Starting deployment for ${appName} on port ${port}, useWindowsService: ${useWindowsService}`);

        const directory = path.join('C:\\inetpub\\wwwroot', appName);
        const zipPath = path.join(directory, 'app.zip');
        const extractPath = directory;
        const appPoolName = `${appName}Pool`; 
        const localAppDataPath = path.join(
            process.env.HOMEDRIVE,
            process.env.HOMEPATH,
            'AppData',
            'Local'
        );

        // Ensure the target directory exists
        ensureDirectoryExists(directory);
        
        // Call the function to grant permissions
        setFolderPermissions(localAppDataPath);
        setFolderPermissions(directory);
        // TODO: get the latest release
        const appUrl = 'https://github.com/beehexacorp/sqlaccountapi/releases/download/release-0.0.11/sql-accounting-release-0.0.11-win-x64.zip';
    
        
    
        // Download the application zip
        log('Downloading application...');
        await downloadFile(appUrl, zipPath)

        if (!!useWindowsService && useWindowsService.toString() === 'true') {
            // STOP the service before copy files
            try {
                execSync(`sc.exe stop ${appName}`, { stdio: 'ignore' });
            } catch (err) {
                log(err);
            }
        } else {
            ensureAppPoolExists(appPoolName)
            stopAppPool(appPoolName);
        }

        // Extract the downloaded zip file
        extractArchive(zipPath, extractPath);
        
        if (!!useWindowsService && useWindowsService.toString() === 'true') {
            // Configure as a Windows Service
            const exePath = path.join(extractPath, `SqlAccountRestAPI.exe`); // Replace with your actual exe name
            
            await configureWindowsService(appName, port, exePath)
            log(`Deployment completed successfully. You can start browsing at http://localhost:${port}/swagger`);
        } else {
            // Configure IIS
            configureIIS(appName, port, extractPath, appPoolName);
            startAppPool(appPoolName)
            log('Deployment completed successfully.');
        }
    } catch (error) {
        log(`Error during deployment: ${error.message}`);
        log('Deployment failed. Check the logs for details.');
        process.exit(1);
    }
}

module.exports = { deploy };
