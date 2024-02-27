const electron=require("electron");
const Save=function(N,Document){}
const Publish=function(N){}
// how will importing resources work??
// how will importing other documents and sections work?
electron.contextBridge.exposeInMainWorld("IPC",{
	FileNew:()=>{return new Promise((Resolve,Reject)=>{electron.ipcRenderer.invoke("file:new").then(R=>R.status?Resolve(R.body):Reject(R.body))})},
	FileOpen:()=>{return new Promise((Resolve,Reject)=>{electron.ipcRenderer.invoke("file:open").then(R=>R.status?Resolve(R.body):Reject(R.body))})},
	FileSave:()=>{},
	EditImportFile:()=>{return new Promise((Resolve,Reject)=>{electron.ipcRenderer.invoke("edit:import-file").then(R=>R.status?Resolve(R.body):Reject(R.body))})},
	EditImportDocument:()=>{return new Promise((Resolve,Reject)=>{electron.ipcRendered.invoke("edit:import-document").then(R=>R.status?Resolve(R.body):Reject(R.body))})},
});
