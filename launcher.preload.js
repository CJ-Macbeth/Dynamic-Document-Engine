const electron = require('electron');
electron.contextBridge.exposeInMainWorld('IPC', {
	File_New: () => {
		return new Promise((Resolve, Reject) => {
			electron.ipcRenderer.invoke('file:new').then(R => R.status ? Resolve(R.body) : Reject(R.body));
		});
	},
	File_Open: () => {
		return new Promise((Resolve, Reject) => {
			electron.ipcRenderer.invoke('file:open').then(R => R.status ? Resolve(R.body) : Reject(R.body));
		});
	}
});
