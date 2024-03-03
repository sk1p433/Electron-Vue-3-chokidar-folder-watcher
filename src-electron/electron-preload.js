/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 */
import { contextBridge, ipcRenderer } from 'electron';
// highlight-next-line
import { dialog } from '@electron/remote';
import chokidar from 'chokidar';


const WINDOW_API = {
  openFileDialog: async (title, folder, filters) => {
      const response = await dialog.showOpenDialog({
        // title,
        // filters,
        properties: ['openDirectory'],
      });
      if (!response.filePaths[0]) {
        return ('Папка не выбрана');
      } else {
        // StartWatcher(response.filePaths[0])
        return response.filePaths[0];
      }
    },
  startWatch: (path, deep) => {
    return StartWatcher(path, deep)
  },
  stopWatch: () => {
    return StopWatcher()
  },
  callNotification: (message) => ipcRenderer.invoke('callNotification', message),

  // send: (message) => ipcRenderer.send('send', message),
  // getSomeInfo: (message) => ipcRenderer.invoke('getSomeInfo', message),
  // onLog: (callback) => ipcRenderer.on('log', (event, args) => {
  //   callback(args)
  // })  
}


contextBridge.exposeInMainWorld('electronApi', WINDOW_API)


let watcher = null;

function StartWatcher(path, deep){
  
  watcher = chokidar.watch(path, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    depth: deep ? 99 : 0
  });
  
  // Something to use when events are received.
  const log = console.log.bind(console);
  const broadcastChannel = new BroadcastChannel('logs');
  
  watcher
    .on('add', path => broadcastChannel.postMessage({ path: path, action: 'fileAdded' , message: `Файл ${path} был добавлен` }))
    .on('change', path => broadcastChannel.postMessage({ path: path, action: 'fileChanged', message: `Файл ${path} был изменён` }))
    .on('unlink', path => broadcastChannel.postMessage({ path: path, action: 'fileDeleted', message: `Файл ${path} был удалён` }));
  
  // More possible events.
  watcher
    .on('addDir', path => broadcastChannel.postMessage({ path: path, action: 'folderAdded', message: `Папка ${path} была добавлена` }))
    .on('unlinkDir', path => broadcastChannel.postMessage({ path: path, action: 'folderDeleted', message: `Папка ${path} была удалена` }))
    .on('error', error => log(`Watcher error: ${error}`))
    .on('ready', () => log('Initial scan complete. Ready for changes'))
    .on('raw', (event, path, details) => { // internal
      log('Raw event info:', event, path, details);
    });
  
  // 'add', 'addDir' and 'change' events also receive stat() results as second
  // argument when available: https://nodejs.org/api/fs.html#fs_class_fs_stats
  watcher.on('change', (path, stats) => {
    if (stats) console.log(`File ${path} changed size to ${stats.size}`);
  });
}

function StopWatcher() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  watcher.close()
}






