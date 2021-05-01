const { app, BrowserWindow } = require('electron')

function createWindow () {
  // Создаем окно браузера.
  const win = new BrowserWindow({
    width: 300,
    minWidth: 300,
    height: 330,
    minHeight: 280,
    icon: "static/icon.png",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  })

// и загружаем index.html в приложении.
  win.loadFile('index.html')
}

app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})