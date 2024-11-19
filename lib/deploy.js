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
        console.error('Failed to re-launch script as administrator:', error.message);
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
        console.error('Error extracting archive:', error.message);
        process.exit(1);
    }
}

function configureIIS(appName, port, physicalPath) {
    try {
        log('Configuring IIS site...');
        const command = `
            Import-Module WebAdministration;
            if (!(Test-Path IIS:\\Sites\\${appName})) {
                New-Website -Name '${appName}' -PhysicalPath '${physicalPath}' -Port ${port} -Force;
            } else {
                Set-ItemProperty IIS:\\Sites\\${appName} -Name bindings -Value "@{protocol='http';bindingInformation='*:${port}:'}";
            }
        `;
        execSync(`powershell -Command "${command}"`, { stdio: 'inherit' });
        log(`IIS site configured successfully. Application is available at http://localhost:${port}`);
    } catch (error) {
        console.error('Error configuring IIS:', error.message);
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

function configureWindowsService(appName, exePath) {
    try {
        log(`Configuring Windows Service: ${appName}`);
        // Stop and remove existing service if it exists
        execSync(`sc.exe stop ${appName}`, { stdio: 'ignore' });
        execSync(`sc.exe delete ${appName}`, { stdio: 'ignore' });

        // Create new service
        execSync(`sc.exe create ${appName} binPath= "${exePath}" start= auto`, { stdio: 'inherit' });

        // Start the service
        execSync(`sc.exe start ${appName}`, { stdio: 'inherit' });
        log(`Windows Service configured successfully. Service: ${appName}`);
    } catch (error) {
        console.error('Error configuring Windows Service:', error.message);
        process.exit(1);
    }
}

function deploy(appName, port, useWindowsService) {
    if (!isAdmin()) {
        relaunchAsAdmin();
    }
    try {
        log(`Starting deployment for ${appName} on port ${port}`);

        const directory = path.join('C:\\inetpub\\wwwroot', appName);
        const zipPath = path.join(directory, 'app.zip');
        const extractPath = directory;

        // TODO: get the latest release
        const appUrl = 'https://github.com/beehexacorp/sqlaccountapi/releases/download/release-0.0.3/sql-accounting-release-0.0.4-win-x64.zip';
    
        // Ensure the target directory exists
        ensureDirectoryExists(directory);
    
        // Download the application zip
        log('Downloading application...');
        downloadFile(appUrl, zipPath).then(() => {
            // Extract the downloaded zip file
            extractArchive(zipPath, extractPath);
        
            if (useWindowsService) {
                // Configure as a Windows Service
                const exePath = path.join(extractPath, `${appName}.exe`); // Replace with your actual exe name
                configureWindowsService(appName, exePath);
            } else {
                // Configure IIS
                configureIIS(appName, port, extractPath);
            }
        
            log('Deployment completed successfully.');
        })
    } catch (error) {
        log(`Error during deployment: ${error.message}`);
        console.error('Deployment failed. Check the logs for details.');
        process.exit(1);
    }
}

module.exports = { deploy };
