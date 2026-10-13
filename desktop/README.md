# Battle City Expanded for Windows

This folder contains the Electron desktop wrapper. The original game files stay
in the project root and are copied into a separate build staging folder.

## Build

From the project root, with Node.js installed:

```powershell
npm.cmd --prefix .\desktop install
npm.cmd --prefix .\desktop run build:win
```

The unpacked Windows app is created in `desktop\dist\win-unpacked`. Run
`Battle City Expanded.exe` from that folder. The game is served locally by
Electron and does not need an internet connection after it has been built.

The build includes editable copies of `assets` and `packs` in
`desktop\dist\win-unpacked\resources\game`. To make different source changes,
edit the files in the project root and build again.

## Run from source

```powershell
npm.cmd --prefix .\desktop start
```
