const path = require('path');
const fsp = require('fs').promises;
const electron = require('electron');
//const Revision = require(path.join(__dirname, 'Revision'));
//const Version  DYNAMICALLY LOAD VERSION FROM FILES
const Dynamic_Document_File = require(path.join(__dirname, 'Dynamic_Document_File'));
const Document_Symbol = Symbol();
const Open_Documents = new Set();
//var Clipboard_Source = null;
//var Clipboard = [];

const Clipboard_Source = Symbol();
var Clipboards = null;

const Open = function (Path) {
	// check/err, check rev
	if (Open_Documents.has(Path)) return false;
	Open_Documents.add(Path);
	let window = new electron.BrowserWindow({ webPreferences: {
		nodeIntegration: false,
		sandbox: true,
		contextIsolation: true,
		preload: path.join(__dirname, 'application.preload.js')
	}});
	window[Document_Symbol] = new Dynamic_Document_File(Path);
	window.setMenuBarVisibility(false);
	window.loadFile('application.html');
	window.webContents.on('will-navigate', E => E.preventDefault());
	window.on('close', () => Open_Documents.delete(Path));
	return Path;
}
const Copy = function (Document, Elements) {
	Clipboards = Object.create(null);
	Clipboards[Clipboard_Source] = Document.Path;
	Clipboards[Document.Path] = [...Elements];
}
const Paste = async function (Document) {
	if (!Object.keys(Clipboards).includes(Document.Path)) {
		Clipboards[Document.Path] = [];
		let Source_Path = Clipboards[Clipboard_Source];
		let Source = Clipboards[Source_Path];
		let Shell = [];
		for (let i = 0, l = Source.length; i < l; i++) {
			Shell[i] = structuredClone(Source[i]);
			if (Shell[i].Type == 'Image') Shell[i].Image = path.join(Source_Path, Shell[i].Image);
		}
		await Document.Save_Images(Shell);
		Clipboards[Document.Path] = Shell;
	}
	return Clipboards[Document.Path];
}
const IPCResponse = function (Body, E) {
	if (E) {
		console.log("Error Encountered:");
		console.log(Body, "\n");
	}
	return {status: (E ? false : true), body: Body};
}
function init () {
	//electron.session.defaultSession.setPermissionRequestHandler((A,B,C)=>C(false));
	electron.ipcMain.handle("file:new", async () => {
		return await electron.dialog.showSaveDialog({
			title: "Create a New Dynamic Document"
		}).then(async R => {
			if (R.cancelled) return IPCResponse(false);
			else return Dynamic_Document_File.New(R.filePath)
			.then(Open)
			.then(IPCResponse);
		}).catch(E => {
			return IPCResponse(E, true);
		});
	});
	electron.ipcMain.handle("file:open", async () => {
		return await electron.dialog.showOpenDialog({
			title: "Open Dynamic Document",
			properties:["multiSelections", "openDirectory"]
		}).then(async R => {
			if (R.cancelled) return IPCResponse(false);
			for(let i = 0, l = R.filePaths.length; i < l; i++) await Open(R.filePaths[i]);
			// check/err
			return IPCResponse(true);
		}).catch(E => {
			return IPCResponse(E, true);
		});
	});
	electron.ipcMain.handle("file:meta", async E => {
		let Document = electron.BrowserWindow.fromWebContents(E.sender)[Document_Symbol];
		if (!Document) return IPCResponse('Failed to identify document from ipc sender', true);
		return await Document.Meta().then(IPCResponse);
	});
	electron.ipcMain.handle("edit:new", async (E, Revision) => {
		let Document = electron.BrowserWindow.fromWebContents(E.sender)[Document_Symbol];
		if (!Document) return IPCResponse('Failed to identify document from ipc sender', true);
		return await Document.New().then(IPCResponse);
	});
	electron.ipcMain.handle("edit:paste", async E => {
		let Document = electron.BrowserWindow.fromWebContents(E.sender)[Document_Symbol];
		if (!Document) return IPCResponse('Failed to identify document from ipc sender', true);
		return await Paste(Document).then(IPCResponse);
	});
	electron.ipcMain.handle("edit:save", async (E, Revision, Content) => {
		let Document = electron.BrowserWindow.fromWebContents(E.sender)[Document_Symbol];
		if (!Document) return IPCResponse('Failed to identify document from ipc sender', true);
		return await Document.Save(Revision, Content).then(IPCResponse);
	});
	electron.ipcMain.handle("edit:save-image", async (E, Element) => {
		let Document = electron.BrowserWindow.fromWebContents(E.sender)[Document_Symbol];
		if (!Document) return IPCResponse('Failed to identify document from ipc sender', true);
		return await Document.Save_Images(Element).then(IPCResponse);
	});
	electron.ipcMain.handle("edit:publish", async (E, Revision) => {
		let Document = electron.BrowserWindow.fromWebContents(E.sender)[Document_Symbol];
		if (!Document) return IPCResponse('Failed to identify document from ipc sender', true);
		return await Document.Publish(Revision).then(IPCResponse);
	});
	electron.ipcMain.handle("edit:delete", async (E, Revision) => {
		let Document = electron.BrowserWindow.fromWebContents(E.sender)[Document_Symbol];
		if (!Document) return IPCResponse('Failed to identify document from ipc sender', true);
		return await Document.Delete(Revision).then(IPCResponse);
	});
	electron.ipcMain.handle("view:copy", async (E, Elements) => {
		let Document = electron.BrowserWindow.fromWebContents(E.sender)[Document_Symbol];
		if (!Document) return IPCResponse('Failed to identify document from ipc sender', true);
		return IPCResponse(Copy(Document, Elements));
	});
	electron.protocol.handle('document',async request=>{
		let Request_URL = new URL(request.url);
		let Parent_Directory = path.dirname(Request_URL.pathname).replace(/\/$/, '');
		let File = path.basename(Request_URL.pathname);
		console.log('here: ', Request_URL.pathname, path.normalize(Request_URL.pathname));
		if (!Open_Documents.has(Parent_Directory)) return new Response('FAILED TO OPEN DOCUMENT');
		else if (File.match(/^UNCONTROLLED_FIGURE.\d+/)) {
			let Path = path.join(Parent_Directory, 'Uncontrolled_Figures', File);
			return await fsp.readFile(Path).catch(async E => {
				return await fsp.readFile(path.join(__dirname, 'Uncontrolled_Figures', 'UNCONTROLLED_FIGURE.1.png'))
			}).then(File => new Response(File)).catch(E => { return 'An unexpected error prevented loaing the requested figure'; });
		} else if (File.match(/^FIGURE.\d+/)) {
			let Path = path.join(Parent_Directory, 'Figures', File);
			return await fsp.readFile(Path).catch(async E => {
				return await fsp.readFile(path.join(__dirname, 'Uncontrolled_Figures', 'UNCONTROLLED_FIGURE.1.png'))
			}).then(File => new Response(File)).catch(E => { return 'An unexpected error prevented loaing the requested figure'; });
		} else return await fsp.readFile(path.normalize(Request_URL.pathname)).then(File => new Response(File)).catch(E => new Response('<h1>FAILED TO OPEN DOCUMENT</h1>'));
	});
	let window = new electron.BrowserWindow({ webPreferences: {
		nodeIntegration: false,
		sandbox: true,
		contextIsolation: true,
		preload: path.join(__dirname, 'launcher.preload.js')
	}});
	window.setMenuBarVisibility(false);
	window.loadFile('launcher.html');
	window.webContents.on('will-navigate', E => E.preventDefault());
}
electron.protocol.registerSchemesAsPrivileged([{scheme:'document',privileges:{standard:true,secure:true,supportsFetchAPI:true}}]);
//electron.app.on('web-contents-created',(E,C)=>C.setWindowOpenHandler(E=>{console.log(E);return {action:'deny'}}));
electron.app.whenReady().then(init);
