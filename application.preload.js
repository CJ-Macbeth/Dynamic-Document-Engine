const electron = require('electron');
const docname = process.argv.find(E=>E.match(/^DOCNAME=/)).slice(8);
electron.contextBridge.exposeInMainWorld('IPC', {
	File_Reference: docname,
	File_New: async () => {
		return new Promise((Resolve, Reject) => {
			electron.ipcRenderer.invoke('file:new').then(R => R.status ? Resolve(R.body) : Reject(R.body))
		});
	},
	File_Open: async () => {
		return new Promise((Resolve, Reject) => {
			electron.ipcRenderer.invoke('file:open').then(R => R.status ? Resolve(R.body) : Reject(R.body));
		});
	},
	File_Meta: async () => {
		return new Promise((Resolve, Reject) => {
			electron.ipcRenderer.invoke('file:meta').then(R => R.status ? Resolve(R.body) : Reject(R.body));
		});
	},
	Edit_New: async Revision => {
		return new Promise((Resolve, Reject) => {
			electron.ipcRenderer.invoke('edit:new', Revision).then(R => R.status ? Resolve(R.body) : Reject(R.body));
		});
	},
	Edit_Paste: async () => {
		return new Promise((Resolve, Reject) => {
			electron.ipcRenderer.invoke('edit:paste').then(R => R.status ? Resolve(R.body) : Reject(R.body));
		});
	},
	Edit_Save: async (Revision, Content) => {
		return new Promise((Resolve, Reject) => {
			electron.ipcRenderer.invoke('edit:save', Revision, Content).then(R => R.status ? Resolve(R.body) : Reject(R.body));
		});
	},
	Edit_Save_Image: async Element => {
		return new Promise((Resolve, Reject) => {
			electron.ipcRenderer.invoke('edit:save-image', Element).then(R => R.status ? Resolve(R.body) : Reject(R.body));
		});
	},
	Edit_Publish: async Revision => {
		return new Promise((Resolve, Reject) => {
			electron.ipcRenderer.invoke('edit:publish', Revision).then(R => R.status ? Resolve(R.body) : Reject(R.body));
		});
	},
	Edit_Delete: async Revision => {
		return new Promise((Resolve, Reject) => {
			electron.ipcRenderer.invoke('edit:delete', Revision).then(R => R.status ? Resolve(R.body) : Reject(R.body));
		});
	},
	View_Copy: async Elements => {
		return new Promise((Resolve, Reject) => {
			electron.ipcRenderer.invoke('view:copy', Elements).then(R => R.status ? Resolve(R.body) : Reject(R.body));
		});
	},
});
