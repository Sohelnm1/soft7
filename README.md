
````markdown
# Setup Instructions

Follow the steps below to install required tools and run the project.

---

## 1. Install Chocolatey (Windows Only)

Open **PowerShell as Administrator** and run:

```powershell
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command " [System.Net.ServicePointManager]::SecurityProtocol = 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"
````

---

## 2. Install Make

```powershell
choco install make
```

---

## 3. Run Make

```bash
make
```

---

## 4. Generate Prisma Client

```bash
npx prisma generate
```

---

## 5. Start the Development Server

```bash
npx next dev
```

---

### ✅ Now your project is running successfully!

Visit:
[http://localhost:3000](http://localhost:3000)

```

---

If you'd like, I can also **create a Makefile** to automate Prisma + Next.js commands. Just tell me **yes** 😊
```



# Project Setup Instructions

Whenever you clone this project, **do not use** `npm install`.

Instead, always run:

```bash
npm ci
```

## Why `npm ci`?

* It installs dependencies exactly as listed in `package-lock.json`.
* Ensures consistent and clean installs.
* Faster than `npm install`.
