# Android Dir Analyzer

An Electron app that analyzes a connected Android device's internal storage and shows what takes up the most space, similar to GNOME Disk Usage Analyzer or WinDirStat.

## Requirements
- Node.js and npm
- `adb` (Android platform-tools) on your PATH
- USB debugging enabled on the device

## Usage
```
npm install
npm start
```
Select a device, then click a folder to drill down; "Up" goes back. Run tests with `npm test`.
