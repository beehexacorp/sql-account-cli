# SQL Accounting CLI

SQL Accounting CLI is a command-line tool designed to streamline the deployment, management, and exposure of the SQL Accounting application on Windows IIS. It allows developers and administrators to automate common tasks such as deploying the application, setting up Cloudflare tunnels, and logging into the application.

## Features

- **Install**: Deploy the SQL Accounting application to IIS.
- **Expose**: Set up Cloudflare tunnels for remote access.
- **Login**: Authenticate with the SQL Accounting application via REST API.

## Table of Contents

- [SQL Accounting CLI](#sql-accounting-cli)
  - [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
    - [Run Locally](#run-locally)
    - [Install from NPM](#install-from-npm)
  - [Prerequisites](#prerequisites)
    - [**Install the .NET Core Hosting Bundle**](#install-the-net-core-hosting-bundle)
    - [**Install .NET Runtime (For Non-IIS Hosting)**](#install-net-runtime-for-non-iis-hosting)
    - [Install IIS Manually](#install-iis-manually)
  - [Usage](#usage)
    - [Commands](#commands)
      - [`install`](#install)
      - [`expose`](#expose)
      - [`login`](#login)
  - [Development](#development)
    - [Folder Structure](#folder-structure)
    - [Logging](#logging)
  - [Contributing](#contributing)
  - [License](#license)

---

## Installation

### Run Locally

To run the CLI locally during development:

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/sql-accounting.git
   cd sql-accounting
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Link the CLI globally (optional for testing commands):

   ```bash
   npm link
   ```

4. Run the commands:

   ```bash
   node bin/sql-accounting.js <command> [options]
   ```

   Or, if linked:

   ```bash
   sql-accounting <command> [options]
   ```

### Install from NPM

To use the CLI after publishing to npm:

1. Install the package globally:

   ```bash
   npm install -g sql-accounting
   ```

2. Run the commands:

   ```bash
   sql-accounting <command> [options]
   ```

---

## Prerequisites

Before using the `install` command, ensure the following prerequisites are met.

---

### **Install the .NET Core Hosting Bundle**

The .NET Core Hosting Bundle is required for hosting ASP.NET Core applications on IIS or running them as Windows Services.

1. **Download the .NET Hosting Bundle**:
   - Visit the official .NET download page: [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)
   - Download the **Hosting Bundle** for the .NET version you're using (e.g., .NET 8.0).

2. **Install the Hosting Bundle**:
   - Run the installer and follow the on-screen instructions.
   - Ensure the following features are selected during installation:
     - **ASP.NET Core Module** for IIS integration.
     - **Runtime components** for running .NET Core applications.

3. **Verify Installation**:
   After installation, verify the hosting bundle is installed correctly by checking the installed runtimes:
   ```cmd
   dotnet --list-runtimes
   ```
   Ensure the output includes the required ASP.NET Core and .NET Runtime versions (e.g., `Microsoft.AspNetCore.App 8.0.0`).

---

### **Install .NET Runtime (For Non-IIS Hosting)**

If you’re hosting the application as a standalone Windows Service, the .NET Runtime and ASP.NET Core Runtime must be installed.

1. **Download the .NET Runtime**:
   - Go to the [official .NET download page](https://dotnet.microsoft.com/download).
   - Download the **.NET Runtime** (e.g., **ASP.NET Core Runtime 8.0**) for your operating system.

2. **Install the Runtime**:
   - Run the downloaded installer.
   - Follow the prompts to complete the installation.

3. **Verify Installation**:
   Run the following command to confirm the runtime is installed:
   ```cmd
   dotnet --list-runtimes
   ```
   Example output:
   ```plaintext
   Microsoft.AspNetCore.App 8.0.0 [C:\Program Files\dotnet\shared\Microsoft.AspNetCore.App]
   Microsoft.NETCore.App 8.0.0 [C:\Program Files\dotnet\shared\Microsoft.NETCore.App]
   ```

4. **Quick Commands to Install Pre-requisites**

- Install .NET Hosting Bundle:

   ```cmd
   curl -O https://dotnet.microsoft.com/download/dotnet/thank-you/runtime-aspnetcore-8.0-windows-hosting-bundle-installer
   start aspnetcore-runtime-8.0.0-win-x64-hosting-bundle.exe
   ```

- Install IIS:

   ```cmd
   dism /online /enable-feature /featurename:IIS-WebServer /all
   ```

- Verify .NET Installation:

   ```cmd
   dotnet --list-runtimes
   ```

### Install IIS Manually

- Please `ignore` if you are already installed `IIS` or use the command line to install application as `Windows Service`

1. **Open PowerShell as Administrator**:
   - Click **Start**, search for `PowerShell`, right-click it, and select **Run as Administrator**.

2. **Install IIS**:
   - Run the following `dism` command to install IIS on client systems (Windows 10/11):

     ```powershell
     dism /Online /Enable-Feature /FeatureName:IIS-WebServerRole /All /NoRestart
     ```

3. **Enable Additional IIS Features for .NET Core 8.0**:
   - Run the following `dism` commands to enable required IIS features:

     ```powershell
     dism /Online /Enable-Feature /FeatureName:IIS-ISAPIFilter /All /NoRestart
     dism /Online /Enable-Feature /FeatureName:IIS-ISAPIExtensions /All /NoRestart
     dism /Online /Enable-Feature /FeatureName:IIS-ASPNET45 /All /NoRestart
     dism /Online /Enable-Feature /FeatureName:IIS-WindowsAuthentication /All /NoRestart
     dism /Online /Enable-Feature /FeatureName:IIS-WebSockets /All /NoRestart
     dism /Online /Enable-Feature /FeatureName:IIS-DefaultDocument /All /NoRestart
     
     ```

4. **Install IIS Management Tools**:
   - If IIS management tools are required, install them using:

     ```powershell
     dism /Online /Enable-Feature /FeatureName:IIS-ManagementService /All /NoRestart
     dism /Online /Enable-Feature /FeatureName:IIS-ManagementConsole /All /NoRestart
     dism /Online /Enable-Feature /FeatureName:IIS-ManagementScriptingTools /All /NoRestart
     ```

5. **Restart Your System**:
   - Some features require a system restart to complete the installation:

     ```powershell
     shutdown -r -t 0
     ```

6. **Verify IIS Installation**:

   - After restarting, check if IIS is installed by opening a web browser and navigating to:

     ```text
     http://localhost
     ```

   - You should see the default IIS welcome page.
  
![alt text](/assets/images/install-iis.png)

---

## Usage

### Commands

#### `install`

Deploy the SQL Accounting application to IIS.

**Example**:

```bash
sql-accounting install --app-name SQLAccounting --port 5001
```

**Options**:

- `--app-name`: Name of the IIS application (required).
- `--port`: Port number for the application (required).

---

#### `expose`

Set up a Cloudflare tunnel for SQL Accounting.

**Example**:

```bash
sql-accounting expose --provider Cloudflared --secret your-secret
```

**Options**:

- `--provider`: Tunnel provider (e.g., `Cloudflared`) (required).
- `--secret`: Authentication secret for the tunnel (required).

---

#### `login`

Authenticate with the SQL Accounting application.

**Example**:

```bash
sql-accounting login --username admin --password password
```

**Options**:

- `--username`: SQL Accounting username (required).
- `--password`: SQL Accounting password (required).

---

## Development

### Folder Structure

```
sql-accounting/
├── bin/
│   └── sql-accounting.js    # CLI entry point
├── lib/
│   ├── deploy.js            # Deployment logic
│   ├── expose.js            # Cloudflare tunnel logic
│   └── login.js             # Login logic
├── logs/
│   └── deployment.log       # Log file (auto-generated in AppData)
├── package.json             # Project metadata
├── README.md                # Project documentation
```

### Logging

Deployment Logs are stored in the `AppData/Local/SqlAccounting` folder for each user on Windows. Check `deployment.log` for details about executed commands.

---

## Contributing

We welcome contributions from the community! To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request with a detailed description of your changes.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.