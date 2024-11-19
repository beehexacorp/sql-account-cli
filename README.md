# **SQL Accounting CLI**

The **SQL Accounting CLI** is a command-line tool designed to streamline the deployment, management, and exposure of the SQL Accounting Rest API application on Windows IIS. This tool automates common tasks such as deploying the application, setting up Cloudflare tunnels, and authenticating with SQL Accounting via REST API.

---

## **Features**

- **Install**: Deploy the SQL Accounting application to IIS effortlessly.
- **Expose**: Set up Cloudflare tunnels for secure remote access.
- **Login**: Authenticate with SQL Accounting using REST API credentials.

---

## **Table of Contents**

- [**SQL Accounting CLI**](#sql-accounting-cli)
  - [**Features**](#features)
  - [**Table of Contents**](#table-of-contents)
  - [**Prerequisites**](#prerequisites)
    - [**Installing Node.js and npm on Windows**](#installing-nodejs-and-npm-on-windows)
      - [**Step 1: Download and Install Node.js**](#step-1-download-and-install-nodejs)
      - [**Step 2: Verify Installation**](#step-2-verify-installation)
      - [**Step 3: Update npm (Optional)**](#step-3-update-npm-optional)
    - [**Install .NET Core Hosting Bundle**](#install-net-core-hosting-bundle)
    - [**Install IIS Manually**](#install-iis-manually)
  - [**Installation**](#installation)
    - [**Run Locally**](#run-locally)
    - [**Install via npm**](#install-via-npm)
  - [**Usage**](#usage)
    - [**Commands**](#commands)
      - [**`install`**](#install)
      - [**`expose`**](#expose)
      - [**`login`**](#login)
  - [**Development**](#development)
    - [**Folder Structure**](#folder-structure)
    - [**Logging**](#logging)
  - [**Contributing**](#contributing)
  - [**License**](#license)

---

## **Prerequisites**

Before using the CLI, ensure the following prerequisites are met.

---

### **Installing Node.js and npm on Windows**

The CLI requires **Node.js** and its package manager **npm** to be installed on your system. Follow these steps to set them up:

#### **Step 1: Download and Install Node.js**

1. **Download Node.js**:
   - Visit the official [Node.js website](https://nodejs.org).
   - Download the **LTS (Long-Term Support)** version for Windows.

2. **Run the Installer**:
   - Double-click the downloaded `.msi` installer (e.g., `node-vxx.x.x-x64.msi`).
   - Follow the installation wizard and accept the default settings.
   - Ensure the option **"Install npm"** is checked during the setup process.

3. **Verify Automatic PATH Configuration**:
   - The installer automatically adds Node.js and npm to your system's PATH environment variable, allowing you to run the `node` and `npm` commands from any terminal.

#### **Step 2: Verify Installation**

1. **Open a Command Prompt or PowerShell**:
   - Press `Win + R`, type `cmd`, and hit Enter, or search for **PowerShell** in the Start menu.

2. **Check Node.js Installation**:
   ```bash
   node --version
   ```
   Example output:
   ```
   v18.x.x
   ```

3. **Check npm Installation**:
   ```bash
   npm --version
   ```
   Example output:
   ```
   9.x.x
   ```

#### **Step 3: Update npm (Optional)**

Update npm to the latest version:
```bash
npm install -g npm@latest
```

---

### **Install .NET Core Hosting Bundle**

1. **Download**:
   - Visit [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download).
   - Download the **Hosting Bundle** for .NET 8.0.

2. **Install**:
   - Run the installer and ensure the **ASP.NET Core Module** is selected.

3. **Verify Installation**:
   ```bash
   dotnet --list-runtimes
   ```

---

### **Install IIS Manually**

If hosting with IIS:

1. **Install IIS**:
   ```powershell
   dism /Online /Enable-Feature /FeatureName:IIS-WebServer /All /NoRestart
   ```

2. **Install Additional Features**:
   ```powershell
   dism /Online /Enable-Feature /FeatureName:IIS-ASPNET45 /All /NoRestart
   ```

3. **Restart System**:
   ```bash
   shutdown -r -t 0
   ```

4. **Verify Installation**:
   Navigate to `http://localhost` to see the IIS default page.

---

## **Installation**

> **Note:** Ensure you run PowerShell as Administrator for the following installation steps.

---

### **Run Locally**

If you are contributing to the project or testing changes, you can run the CLI locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/sql-accounting.git
   cd sql-accounting
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Link the CLI globally (optional)**:
   ```bash
   npm link
   ```

4. **Run commands**:
   - Without linking:
     ```bash
     node bin/sql-accounting.js <command> [options]
     ```
   - With linking:
     ```bash
     sql-accounting <command> [options]
     ```

---

### **Install via npm**

1. **Install the package globally**:
   ```bash
   npm install -g sql-accounting
   ```

2. **Run commands**:
   ```bash
   sql-accounting <command> [options]
   ```

---

## **Usage**

### **Commands**

#### **`install`**

Deploy the SQL Accounting application to IIS.

**Example**:
```bash
sql-accounting install --app-name SQLAccounting --port 5001
```

**Options**:
- `--app-name`: Name of the IIS application (required).
- `--port`: Port number for the application (required).

---

#### **`expose`**

Set up a Cloudflare tunnel for SQL Accounting.

**Example**:
```bash
sql-accounting expose --provider Cloudflared --secret your-secret
```

**Options**:
- `--provider`: Tunnel provider (e.g., `Cloudflared`) (required).
- `--secret`: Authentication secret for the tunnel (required).

---

#### **`login`**

Authenticate with the SQL Accounting application.

**Example**:
```bash
sql-accounting login --username admin --password password
```

**Options**:
- `--username`: SQL Accounting username (required).
- `--password`: SQL Accounting password (required).

---

## **Development**

### **Folder Structure**

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

---

### **Logging**

Deployment logs are stored in the `AppData/Local/SqlAccounting` folder for each user on Windows. Check the `deployment.log` file for detailed execution information.

---

## **Contributing**

We welcome contributions from the community! To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.

---

## **License**

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
