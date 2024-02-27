const electron = require('electron');
console.log(process.versions.electron);
electron.app.whenReady().then(()=>{
	electron.protocol.handle('test',()=>{});
});
