const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

let settingsWindow;

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            additionalArguments: [`EDS-ENV=${app.isPackaged}`],
        },
    });
    
    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }
    
    // Open the DevTools.
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }
    
    // Create the settings window that we can use later.
    settingsWindow = new BrowserWindow({
        width: 800,
        height: 600,
        parent: mainWindow,
        modal: true,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            additionalArguments: [`EDS-ENV=${app.isPackaged}`],
        },
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const openSettings = async () => {
    if (SETTINGS_WINDOW_VITE_DEV_SERVER_URL) {
        settingsWindow.loadURL(`${SETTINGS_WINDOW_VITE_DEV_SERVER_URL}/settings.html`);
    } else {
        settingsWindow.loadFile(path.join(__dirname, `../renderer/${SETTINGS_WINDOW_VITE_NAME}/settings.html`));
    }

    settingsWindow.show()
}

const menuTemplate = [
    {
        label: 'File',
        submenu: [
            { label: 'Settings', click: async () => { openSettings(); } },
            { role: 'quit' }
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Github',
                click: async () => {
                    const { shell } = require('electron');
                    await shell.openExternal('https://github.com/punkfairie/ed-safari');
                }
            }
        ]
    }
]

const menu = Menu.buildFromTemplate(menuTemplate)
Menu.setApplicationMenu(menu)