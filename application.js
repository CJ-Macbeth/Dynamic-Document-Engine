var Path, GUI, Edit, View;
var Open_Revision = null;
const Open_Revisions = Object.create(null);

// how will this work??
const Confirm = async function (Message) {}

const Close = async function () {
	let Confirmed = await Confirm(''); // add message and data check here
	if (Confirmed) window.close();
}

//
//  add      -> remove   index
//  modify   -> modify   index !options
//  move     -> move     target index
//  remove   -> add      index options
//  copy     -x
//  paste    -> remove   indexes
//  select   -> deselect index
//  deselect -> select   index
//

const View_Revision = async function (Revision) {
	GUI.Navigate(Main_Menu, true);
	if (typeof Revision!= 'string') Revision = await Latest();
	if (Open_Revision) Open_Revision.Rest();
	if (Revision in Open_Revisions) Open_Revisions[Revision].Wake();
	else Open_Revisions[Revision] = new Dynamic_Document_Linker(Revision, Path, View, Edit, GUI, Menu_Boilerplate);
	Open_Revision = Open_Revisions[Revision];
}
var Escape = View_Revision;
const Menu = Object.create(null);
const Menu_Boilerplate = [
	{
		'Escape': {
			Name: 'View a Different Revision',
			Function: async () => {
				let Meta = await IPC.File_Meta();
				let Shell = [];
				Meta.Controlled_Revisions.forEach(Revision => Shell.push({
					Name: Revision,
					Function: () => View_Revision(Revision)
				}));
				Meta.Uncontrolled_Revisions.forEach(Revision => Shell.push({
					Name: Revision,
					Function: () => View_Revision(Revision)
				}));
				GUI.Navigate(new MGUI.Menu({
					'n': {
						Name: 'Create a New Uncontrolled Revision',
						Function: () => {
							IPC.Edit_New().then(View_Revision);
						}
					}
				},{},{},{},Shell));
			}
		}
	},
	{},
	{
		'n': {
			Name: 'New Document',
			Function: IPC.File_New // may need to be setup differently?
		},
		'o': {
			Name: 'Open Document',
			Function: IPC.File_Open // may need to be setup differently?
		},
		'q': {
			Name: 'Exit Program',
			Function: Close
		},
	},
	{},
	[
		{ Name: 'Dynamic Document Engine' } // insert the version here
	]
];
const Latest = async function (Meta) {
	if (!Meta) Meta = await IPC.File_Meta();
	if (Meta.Current_Revision) return Meta.Current_Revision;
	else if(Meta.Controlled_Revisions.length > 0) return Meta.Controlled_Revisions[Meta.Controlled_Revisions.length - 1];
	else return Meta.Uncontrolled_Revisions[Meta.Uncontrolled_Revisions.length - 1];
}

const Main_Menu = new MGUI.Menu(Menu_Boilerplate);
const init = function () {
	window.addEventListener('message', E => {
		let Revision = Object.keys(Open_Revisions).find(Revision => {
			return E.source == Open_Revisions[Revision].View.contentWindow;
		});
		if (Revision) Open_Revisions[Revision].Alert(E.data);
	});
	Edit = document.getElementById('Edit');
	View = document.getElementById('View');
	GUI = new MGUI(document.getElementById('Menu'));
	GUI.Navigate(Main_Menu);
	IPC.File_Meta().then(Meta => {
		Path = IPC.File_Reference;
		return Meta;
	}).then(Latest).then(View_Revision);
}
