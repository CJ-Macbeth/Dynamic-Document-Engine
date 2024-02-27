const Close = function () { window.close(); }
const Menu = Object.create(null);
Menu.Main = new MGUI.Menu({}, {}, {
	'n': {
		Name: 'New Document',
		Function: () => {
			IPC.File_New().then(Close).catch(console.log);
		}
	},
	'o': {
		Name:'Open Document',
		Function: () => {
			IPC.File_Open().then(Close).catch(console.log);
		}
	},
	'q': {
		Name:'Exit Program',
		Function: Close
	}
},{},[
	{
		Name:'Dynamic Document Engine v1.0.0'
	}
]);
var GUI;
const init = function () {
	GUI = new MGUI(document.getElementById('Menu'));
	GUI.Navigate(Menu.Main);
}
