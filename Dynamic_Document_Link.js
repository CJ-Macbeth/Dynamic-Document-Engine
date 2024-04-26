// new Link
// Draw (Editing) ? editing mode, escaping back to regular mode
// Rest () ? is there a better way
// Wake () ? is there a better way
// Toggle_Edit () ? better way?
// Toggle_Navigate () ? better way?
// Navigate ()
// Escape ()
// Add ()
// Modify ()
// Move ()
// Remove ()
// Copy ()
// Paste ()
// Select ()
// Selections ()
// Undo ()
// Redo ()
// Draw_ ...
// Menu_ ...
//
//
// HOW TO DO THIS:
//
// -> WAVE: make a blank (text-type only) document for testing
//
// -> WAVE: view functionality
//    -> repair the cross-document copy mechanism
//    -> create default title (UNTITLED) in new documents
//    -> mgui: escape - enter a different revision
//    -> mgui: arrow - navigate to element
//    -> mgui: space - select/deselect element
//    -> mgui: control-c - copy the selected elements
//    -> mgui: control-v - paste after selected elements (only if uncontrolled revision)
//    -> mgui: enter: edit element (only if uncontrolled revision)
//
//    -> transition select to use numbering/visible-only
//    -> select and deselect all
//          
// -> WAVE: text editing functionality (engaged based on the type of the waypoint element)
//    -> mgui: enter - save, create a new element next
//    -> mgui: alt-enter - save, create a new element previous
//    -> mgui: escape - save, escape to view
//    -> mgui: alt-escape - don't save, escape to view
//    -> mgui: alt-arrowdown- enter the next element
//    -> mgui: alt-arrowup - enter the previous element
//    -> input: edit the title, section, subsection, step, instruction, tooltip
//    -> if not title, mgui change type
//
// -> WAVE: image editing functionality
//    -> upload a new image
//    -> mgui: ArrowRight - select image source
//    -> select from existing uncontrolled images
//    -> select from existing controlled images
//
//    -> repair image sorting: only draw from Figures if path is relative (/^FIGURE, /^UNCONTROLLED)
//    -> repair image src in edit space (must be platform agnostic, look in Draw_Input_Uncontrolled/Controlled_Figure)
//
// -> WAVE: table editing functionality
//    -> tab and shift-tab - navigate elements
//    -> mgui: ud arrows for navigation
//    -> mgui: control arrows for creation of new rows or columns
//    -> mgui: control-alt arrows to delete rows, columns
//
// -> WAVE: updating code to match current model
//    -> file: function provides API for message processing
//    -> file, view, edit, link: this.API(Message.data.Command, Message.data.Options)
//    -> update TODOAPI: include Waypoint and Navigation
//    -> view: hold the waypoint, navigate to the waypoint, return the waypoint
//    -> link: request the waypoint from document
//    -> view: match types and elements
//    -> edit: match types and elements
//    -> file: use prewritten HTML documents, insert html using jsdom (rather than strings)
//    -> view: onclick navigation
//    -> view: onclick + ctrl/shft: selection
//
//    -> display revision and title in edit space?
//
// -> WAVE: variable editing functionality
//    -> conditioning documents is it's own pathway:
//    -> transition to alternate UX design
//    -> create functional condition editing pathways
//    -> new variable, edit variable, move variable, remove variable
//    -> new, edit, remove conditions
//
// -- Wave: final wave for Ian
//    -> css and final touches
//    -> editor Unconditional (default) and conditional (+ WARNING FOR CONDITIONAL)
//    -> default/unreferenced images
//    -> image expansion
//    -> move elements
//    -> remove elements
//    -> new uncontrolled revision
//    -> delete uncontrolled revision
//    -> save changes to uncontrolled revision
//    -> publish uncontrolled revision
//    -- autoremove unreferenced uncontrolled figures
//    -- UNCONTROLLED banner and styling
//    -- table of contents
//
// -- WAVE: rewrite entire TODOAPI to match the current document states
//
// -- WAVE: revisions
//    -- instruction text -> TinyMCE text
//    -- autogen table of contents
//    -- sticky navigation panel
//
// -- WAVE: undo, redo, paste
//    -- copy to lambda document
//
// -- WAVE: mgui revision
//    -- custom order
//    -- separated groupings (spaced, color coded?)
//    -- in-menu (simple) panel expansions, in-element inputs (replace text types with this)
//    -- transition all inputs to mgui, and dragable popup mgui panels
//    -- turn steps into checklist?? printable checklist?
//
// -- WAVE: modularize window=document, class=revision,
//    -- ensure that class is setup as cleanly as possible, 
//    -- try to separate class from direct IPC calls, instead, try some agnostic middleman functions or parent class
//
//
// !!!!!!!!!!!!!!!
// before sleep, bring waypoint and selected into Linker,
// linker supply them again on reopen (along with scroll position?)
//

const Dynamic_Document_Linker = function (Revision, URL, View, Edit, GUI, Menu_Boilerplate) {
	this.Revision = Revision;
	if (URL[0]!='/')URL='/'+URL;
	this.URL = `document://${URL}`;
	this.View = View;
	this.Edit = Edit;
	this.GUI = GUI;
	this.Menu_Boilerplate = Menu_Boilerplate;
	this.Element = null;
	this.Uncontrolled = this.Revision.match(/UNCONTROLLED.\d+.html$/) ? true : false;
	this.Mode = 'View';
	this.Prepare_Menus();
	this.Wake();
}
Dynamic_Document_Linker.prototype.Alert = async function (Message) {
	await this.Refresh();
}
Dynamic_Document_Linker.prototype.Rest = function () {
	// what does this function need to do?
	//
	// -- depopulate the edit space
	// -- save the current element changes in some buffer or to the document
	this.Edit.innerHTML = '';
}
Dynamic_Document_Linker.prototype.Wake = function () {
	let load;
	load = async () => {
		this.Refresh();
		this.Unconditional(false);
		this.View.removeEventListener('load', load);
	}
	this.View.addEventListener('load', load);
	this.View.setAttribute('src', this.URL + '/' + this.Revision);
}
Dynamic_Document_Linker.prototype.Refresh = function (Mode) {
	this.Save = null;
	if (this.Modes.includes(Mode)) this.Mode = Mode;
	this.Edit.innerHTML = '';
	switch (this.Mode) {
		case 'View':
			this.View_Mode();
			break;
		case 'Edit':
			this.Edit_Mode();
			break;
		case 'Condition':
			this.Condition_Mode();
			break;
	}
}
Dynamic_Document_Linker.prototype.Unconditional = async function (Setting) {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => {
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Unconditional',
			Options: Setting
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Waypoint = async function () {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => {
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Waypoint'
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Navigate = async function (Up) {
	if (typeof Up != 'boolean') Up = false;
	let Channel = new MessageChannel();
	return new Promise ((Resolve, Reject) => {
		Channel.port1.onmessage = Message => { 
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Navigate',
			Options: Up
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Conditions = function (Meta) {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => {
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Conditions',
			Options: Meta
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Select = function () {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => { 
			delete Channel;
			if (Message.data.status){
				this.View_Mode();
				Resolve(true);
			} else Reject(Message.data.result);
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Select'
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Selections = function () {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => { 
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Selections'
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Copy = function (Waypoint) {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => { 
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Copy',
			Options: Waypoint
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Paste = async function () {
	let Channel = new MessageChannel();
	let Clipboard = await IPC.Edit_Paste();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => { 
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Paste',
			Options: Clipboard
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Add_Condition = function (Name, Values) {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => {
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Add Condition',
			Options: {
				Name: Name, 
				Values: Values
			}
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Modify_Condition = function (Name, Rename, Values) {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => {
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Modify Condition',
			Options: {
				Name: Name,
				Rename: Rename,
				Values: Values
			}
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Move_Conditions = function (List) {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => {
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Move Condition',
			Options: {
				List: List
			}
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Remove_Condition = function (Name) {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => {
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Remove Condition',
			Options: Name
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Condition = function (Conditions) {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => {
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Condition',
			Options: Conditions
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Add = function (Previous, Type) {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => { 
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Add',
			Options: {
				Data: {Type: Type ? Type : 'Instruction'},
				Target: Previous ? true : false
			}
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Modify = function (Options) {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => {
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Modify',
			Options: Options
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Move = function (Options) {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => {
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Move',
			Options: Options // FIX (not setup yet)
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Remove = function (Options) {
	let Channel = new MessageChannel();
	return new Promise((Resolve, Reject) => {
		Channel.port1.onmessage = Message => {
			delete Channel;
			Message.data.status ? Resolve(Message.data.result) : Reject(Message.data.result);
		}
		this.View.contentWindow.postMessage({
			Command: 'Remove',
			Options: Options
		}, this.URL, [Channel.port2]);
	});
}
Dynamic_Document_Linker.prototype.Draw_Input_Text = function () {
	let input = document.createElement('input');
	if (this.Element.Text) input.value = this.Element.Text;
	this.Edit.appendChild(input);
	input.focus();
}
Dynamic_Document_Linker.prototype.Draw_Input_Select = function () {
	let select = document.createElement('select');
	['Section', 'Subsection', 'Step', 'Instruction', 'Counterinstruction', 'Tooltip'].forEach(Type => {
		let option = document.createElement('option');
		option.value = Type;
		option.innerHTML = Type;
		select.appendChild(option);
	});
	select.value = this.Element.Type;
	this.Edit.appendChild(select);
}
Dynamic_Document_Linker.prototype.Draw_Input_Uncontrolled_Figures = async function () {
	let Meta = await IPC.File_Meta();
	for (let i = 0, l = Meta.Uncontrolled_Figures.length; i < l; i++) {
		let button  = document.createElement('button');
		button.style.display = 'block';// remove when writing css
		button.setAttribute('class', 'Image');
		button.setAttribute('data-source', Meta.Uncontrolled_Figures[i]);
		button.onclick = function (E) {
			let Sources = this.parentElement.getElementsByClassName('Source');
			for (let i = 0, l = Sources.length; i < l; i++) Sources[0].classList.remove('Source');
			this.classList.add('Source');
		}
		let image = document.createElement('img');
		image.src = Meta.Uncontrolled_Figure_Path.replace(/FIGURE$/, Meta.Uncontrolled_Figures[i]);
		image.style.width = '95%';
		button.appendChild(image);
		this.Edit.appendChild(button);
	}
}
Dynamic_Document_Linker.prototype.Draw_Input_Controlled_Figures = async function () {
	let Meta = await IPC.File_Meta();
	for (let i = 0, l = Meta.Figures.length; i < l; i++) {
		let button  = document.createElement('button');
		button.style.display = 'block';// remove when writing css
		button.setAttribute('class', 'Image');
		button.setAttribute('data-source', Meta.Figures[i]);
		button.onclick = function (E) {
			let Sources = this.parentElement.getElementsByClassName('Source');
			for (let i = 0, l = Sources.length; i < l; i++) Sources[0].classList.remove('Source');
			this.classList.add('Source');
		}
		let image = document.createElement('img');
		image.src = Meta.Figure_Path.replace(/FIGURE$/, Meta.Figures[i]);
		//image.src = Meta.Path + '/Figures/' + Meta.Figures[i]; // !!!!!!!!!!!! FIX
		image.style.width = '95%';
		button.appendChild(image);
		this.Edit.appendChild(button);
	}
}
Dynamic_Document_Linker.prototype.Draw_Input_New_Figure = function () {
	let input = document.createElement('input');
	input.type = 'file';
	input.setAttribute('accept', 'img/*');
	this.Edit.appendChild(input);
	input.focus();
}
Dynamic_Document_Linker.prototype.Draw_Input_Table = function (Table, Column, Row) {
	if (!Table && !this.Element.Table) Table = [['H1']];
	else if (!Table) Table = this.Element.Table;
	if (Table[0].length == 0) Table[0].push('');
	let table = document.createElement('table');
	let headrow = document.createElement('tr');
	for (let i = 0, l = Table[0].length; i < l; i++) {
		let input = document.createElement('input');
		input.value = Table[0][i]; // HTMLS here
		input.setAttribute('data-col', i);
		input.setAttribute('data-row', 0);
		let headcell = document.createElement('th');
		headcell.appendChild(input);
		headrow.appendChild(headcell);
	}
	table.appendChild(headrow);
	for (let i = 1, l = Table.length; i < l; i++) {
		let row = document.createElement('tr');
		for (let i2 = 0, l2 = Table[i].length; i2 < l2; i2++){
			let input = document.createElement('input');
			input.value = Table[i][i2]; // HTMLS here
			input.setAttribute('data-col', i2);
			input.setAttribute('data-row', i);
			let cell = document.createElement('td');
			cell.appendChild(input);
			row.appendChild(cell);
		}
		table.appendChild(row);
	}
	this.Edit.appendChild(table);
	if (!isNaN(Column) && !isNaN(Row)) table.children[Row].children[Column].children[0].focus();
	else headrow.children[0].children[0].focus();
}
Dynamic_Document_Linker.prototype.Draw_Input_Variables = function () {
	if (!this.Element.Variables || Object.keys(this.Element.Variables).length == 0) return;
	Object.keys(this.Element.Variables).forEach(Variable => {
		let Table = document.createElement('table');
		Table.setAttribute('data-variable', Variable);
		Table.setAttribute('class', 'Variable');
		let Head_Row = document.createElement('tr');
		let Head_Cell = document.createElement('th');
		Head_Row.appendChild(Head_Cell);
		Table.appendChild(Head_Row);
		this.Element.Variables[Variable].forEach(Value => {
			let Row = document.createElement('tr');
			let Cell = document.createElement('td');
			Cell.setAttribute('data-value', Value);
			Row.appendChild(Cell);
			Table.appendChild(Row);
		});
		this.Edit.appendChild(Table);
	});
}
Dynamic_Document_Linker.prototype.Save = null;
Dynamic_Document_Linker.prototype.Save_Title = async function () {
	let Text = this.Edit.getElementsByTagName('input')[0].value;
	return await this.Modify({Text:Text});
}
Dynamic_Document_Linker.prototype.Save_Text = async function () {
	let Text = this.Edit.getElementsByTagName('INPUT')[0].value;
	let Type = this.Edit.getElementsByTagName('SELECT')[0].value;
	if (this.Element.Text != Text || this.Element.Type != Type) return await this.Modify({Text: Text, Type: Type}); // this returns a promise ?? how deal?
	else return true;
}
Dynamic_Document_Linker.prototype.Save_Image = async function () {
	let Image = this.Edit.getElementsByTagName('INPUT')[0];
	if (Image.tagName == 'INPUT' && Image.files.length > 0) {
		try {
			let Options = await IPC.Edit_Save_Image({Type: 'Image', Image: Image.files[0].path});
			return await this.Modify(Options);
		} catch { return; }
	}
	else if (Image.getAttribute('data-source') != this.Element.Image) return await this.Modify({Image: Image.getAttribute('data-source')});
	else return true;
}
Dynamic_Document_Linker.prototype.Save_Table = async function (Soft) {
	let Shell = [[]];
	let Rows = this.Edit.getElementsByTagName('tr');
	let Headers = Rows[0].getElementsByTagName('th');
	for (let i = 0, l = Headers.length; i < l; i++) Shell[0].push(Headers[i].children[0].value); //HTMLS
	for (let i = 1, l = Rows.length; i < l; i++) {
		let ShellB = [];
		let Cells = Rows[i].getElementsByTagName('td');
		for (let i2 = 0, l2 = Cells.length; i2 < l2; i2++) ShellB.push(Cells[i2].children[0].value);
		Shell.push(ShellB);
	}
	if (Soft) return Shell;
	else return await this.Modify({Type: 'Table', Table: Shell}); // check if change before pushing
}
Dynamic_Document_Linker.prototype.Save_Variable_Positions = async function () {
	let List = [...this.Edit.getElementsByClassName('Variable')].map(Variable => Variable.innerHTML);
	if (List.length > 1) return await this.Move_Conditions(List);
	else return true;
}
Dynamic_Document_Linker.prototype.Save_Variable = async function () {
	let Shell = Object.create(null);
	let Variable_Input = this.Edit.getElementsByTagName('th')[0].children[0];
	if (!Variable_Input.value || Variable_Input.value.length == 0) return false;
	else Shell.Variable = Variable_Input.value;
	if (Variable_Input.hasAttribute('data-variable')) Shell.Original = Variable_Input.getAttribute('data-variable');
	let Values = Object.create(null);
	let Value_Inputs = [...this.Edit.getElementsByTagName('tr')].slice(1).map(Element => Element.getElementsByTagName('input')[0]).filter(Element => Element != undefined);
	for (let i = 0, l = Value_Inputs.length; i < l; i++) {
		let Old_Value_Name = Value_Inputs[i].hasAttribute('data-value') ? Value_Inputs[i].getAttribute('data-value') : null;
		let New_Value_Name = Value_Inputs[i].value;
		if (!New_Value_Name && Old_Value_Name) New_Value_Name = Old_Value_Name;
		else if (!New_Value_Name && !Old_Value_Name) continue;
		Values[Value_Inputs[i].value] = Old_Value_Name; 
		// Old_Value_Name is used by View.js for propegating changes to conditioned elements seamlessly :)
	}
	if (Object.keys(Values).length > 1) Shell.Values = Values; // if 1 or less, variable is BOOLEAN
	else Shell.Values = null;
	if (Shell.Original) return await this.Modify_Condition(Shell.Original, Shell.Variable, Shell.Values);
	else return await this.Add_Condition(Shell.Variable, Shell.Values === null ? null : Object.keys(Shell.Values));
}
Dynamic_Document_Linker.prototype.Save_Conditions = async function () {
	let Shell = this.Conditions_Shell;
	delete this.Conditions_Shell;
	delete this.Conditions_Shell_Index;
	return await this.Condition(Shell);
}
Dynamic_Document_Linker.prototype.Save_Condition = async function () {
	let Shell = {};
	[...this.Edit.getElementsByTagName('select')].forEach(Element => {
		if (Element.value === 'null') return;
		let Value = Element.value;
		if (Value === 'true') Value = true;
		else if (Value === 'false') Value = false;
		Shell[Element.getAttribute('data-variable')] = Value;
	});
	if (Object.keys(Shell).length > 0) Number.isInteger(this.Conditions_Shell_Index) ? this.Conditions_Shell.splice(this.Conditions_Shell_Index, 1, Shell) : this.Conditions_Shell.push(Shell);
	delete this.Conditions_Shell_Index;
}
Dynamic_Document_Linker.prototype.View_Mode = async function () {
	let Waypoint = await this.Waypoint();
	let Meta = await this.Copy(0);
	let Shell = [{
		'ArrowUp': this.Menus.Navigate_Up,
		'ArrowDown': this.Menus.Navigate_Down
	}, {
		'Escape': this.Menus.Unconditional
	}, {
		'c': this.Menus.Copy
	}, {}, []];
	let Selected = await this.Selections().then(Selections => Selections.includes(Waypoint));
	if (Selected) Shell[1].Enter = this.Menus.Deselect;
	else Shell[1].Enter = this.Menus.Select;
	if (this.Uncontrolled) {
		Shell[0].Enter = this.Menus.Edit_Element;
		Shell[1].Enter = this.Menus.Condition_Element;
		Shell[2].s = this.Menus.Save_Revision,
		Shell[2].v = this.Menus.Paste;
		Shell[4].p = this.Menus.Publish_Revision;
		Shell[4].Delete = this.Menus.Delete_Revision;
	}
	let Menu = new MGUI.Menu(...MGUI.Boilerplate(this.Menu_Boilerplate, Shell));
	this.GUI.Navigate(Menu, true);
}
Dynamic_Document_Linker.prototype.Edit_Mode = async function () {
	this.Element = await this.Copy(true);
	let Shell = [{
		'Escape': this.Menus.View_Mode,
		'Enter': this.Menus.New_Next
	}, {
		'Escape': this.Menus.Abandon,
		'Enter': this.Menus.New_Previous,
		'ArrowUp': this.Menus.Navigate_Up,
		'ArrowDown': this.Menus.Navigate_Down,
		'i': this.Menus.New_Image,
		't': this.Menus.New_Table
	}, {}, {}, []];
	if (this.Element.Type == 'Meta') {
		delete Shell[1].Enter;
		this.Draw_Input_Text();
		this.Save = this.Save_Title;
	} else if (this.Element.Type == 'Image') {
		this.Draw_Input_New_Figure();
		Shell[1].ArrowRight = this.Menus.Image_Source;
		this.Save = this.Save_Image;
	} else if (this.Element.Type == 'Table') {
		this.Draw_Input_Table();
		Shell[2].ArrowUp = this.Menus.Table_Row_Above;
		Shell[2].ArrowDown = this.Menus.Table_Row_Below;
		Shell[2].ArrowRight = this.Menus.Table_Column_Right;
		Shell[2].ArrowLeft = this.Menus.Table_Column_Left;
		Shell[3].ArrowUp = this.Menus.Table_Remove_Row_Above;
		Shell[3].ArrowDown = this.Menus.Table_Remove_Row_Below;
		Shell[3].ArrowRight = this.Menus.Table_Remove_Column_Right;
		Shell[3].ArrowLeft = this.Menus.Table_Remove_Column_Left
		this.Save = this.Save_Table;
	} else {
		this.Draw_Input_Select();
		this.Draw_Input_Text();
		this.Save = this.Save_Text;
	}
	let Waypoint = await this.Waypoint();
	if (Waypoint > 1) Shell[3].ArrowUp = this.Menus.Move_Up;
	if (Waypoint != 0) {
		Shell[3].ArrowDown = this.Menus.Move_Down;
		Shell[1].Delete = this.Menus.Remove;
	}
	let Menu = new MGUI.Menu(...Shell);
	this.GUI.Navigate(Menu, true);
}
Dynamic_Document_Linker.prototype.Condition_Mode = async function () {
	// get the current state of conditions, and bring them into edit
	let Waypoint = await this.Waypoint();
	let Shell = [{
		'Escape': this.Menus.View_Mode,
		//'Enter': this.Menus.Navigate_Down;
	}, {
		'Escape': this.Menus.Abandon,
		//'Enter': this.Menus.Navigate_Up;
	}, {}, {}, []];
	if (Waypoint == 0) {
		// draw variables
		let Conditions = await this.Conditions();
		if (Conditions) {
			let Table = document.createElement('table');
			Object.keys(Conditions).forEach(Condition => {
				let Row = document.createElement('tr');
				let Move_Up_Cell = document.createElement('td')
				let Move_Up_Button = document.createElement('button');
				Move_Up_Button.innerHTML = 'Up';
				Move_Up_Button.onclick = function () {
					if (this.parentNode.parentNode.previousElementSibling) this.parentNode.parentNode.parentNode.insertBefore(this.parentNode.parentNode, this.parentNode.parentNode.previousElementSibling);
				}
				Move_Up_Cell.appendChild(Move_Up_Button);
				Row.appendChild(Move_Up_Cell);
				let Move_Down_Cell = document.createElement('td');
				let Move_Down_Button = document.createElement('button');
				Move_Down_Button.innerHTML = 'Down';
				Move_Down_Button.onclick = function () {
					if (this.parentNode.parentNode.nextElementSibling) this.parentNode.parentNode.parentNode.insertBefore(this.parentNode.parentNode.nextElementSibling, this.parentNode.parentNode);
				}
				Move_Down_Cell.appendChild(Move_Down_Button);
				Row.appendChild(Move_Down_Cell);
				let Element_Cell = document.createElement('td');
				let Element = document.createElement('div');
				Element.setAttribute('class', 'Variable');
				Element.innerHTML = Condition;
				Element_Cell.appendChild(Element);
				Row.appendChild(Element_Cell);
				Table.appendChild(Row);
			});
			this.Edit.appendChild(Table);
		}
		Shell[1].ArrowLeft = this.Menus.Delete_Variable;
		Shell[1].ArrowRight = this.Menus.New_Variable;
		Shell[1].ArrowDown = this.Menus.Edit_Variable;
		this.Save = this.Save_Variable_Positions;
	} else {
		if (!this.Conditions_Shell) {
			let Conditions = await this.Conditions();
			if (!Conditions) Conditions = [];
			this.Conditions_Shell = await Conditions;
		}
		// draw the existing conditions: click to open edit or remove
		// mgui: alt-right - create new condition
		// mgui: alt-down - edit exising condition
		// mgui: alt-left - remove existing condition
		Shell[1].ArrowRight = this.Menus.New_Condition;
		Shell[1].ArrowLeft = this.Menus.Remove_Condition;
		Shell[1].ArrowDown = this.Menus.Edit_Condition;
		this.Save = this.Save_Conditions;
	}
	let Menu = new MGUI.Menu(...Shell);
	this.GUI.Navigate(Menu, true);
}
Dynamic_Document_Linker.prototype.Edit_Variable_Mode = function (Variable, Values) {
	let Draw = Value => {
		let Row = document.createElement('tr');
		let Remove_Cell = document.createElement('td');
		let Remove_Button = document.createElement('button');
		Remove_Button.innerHTML = '-';
		Remove_Button.onclick = function () {this.parentNode.parentNode.remove()};
		Remove_Cell.appendChild(Remove_Button);
		Row.appendChild(Remove_Cell);
		let Move_Up_Cell = document.createElement('td');
		let Move_Up_Button = document.createElement('button');
		Move_Up_Button.innerHTML = 'Up';
		Move_Up_Button.onclick = function () {
			if (
				this.parentNode.parentNode.previousElementSibling
				&& this.parentNode.parentNode.previousElementSibling != this.parentNode.parentNode.parentNode.firstElementChild
			) this.parentNode.parentNode.parentNode.insertBefore(this.parentNode.parentNode, this.parentNode.parentNode.previousElementSibling);
		}
		Move_Up_Cell.appendChild(Move_Up_Button);
		Row.appendChild(Move_Up_Cell);
		let Move_Down_Cell = document.createElement('td');
		let Move_Down_Button = document.createElement('button');
		Move_Down_Button.innerHTML = 'Down';
		Move_Down_Button.onclick = function () {
			if (this.parentNode.parentNode.nextElementSibling) this.parentNode.parentNode.parentNode.insertBefore(this.parentNode.parentNode.nextElementSibling, this.parentNode.parentNode);
		}
		Move_Down_Cell.appendChild(Move_Down_Button);
		Row.appendChild(Move_Down_Cell);
		let Input_Cell = document.createElement('td');
		let Input = document.createElement('input');
		if (Value) {
			Input.value = Value;
			Input.setAttribute('data-value', Value);
		}
		Input_Cell.appendChild(Input);
		Row.appendChild(Input_Cell);
		Table.appendChild(Row);
	}
	this.Edit.innerHTML = '';
	let Table = document.createElement('table');
	Table.setAttribute('class', 'Variable');
	let Head_Row = document.createElement('tr');
	let New_Value_Cell = document.createElement('td');
	New_Value_Cell.setAttribute('colspan', '3');
	let New_Value_Button = document.createElement('button');
	New_Value_Button.innerHTML = '+';
	New_Value_Button.onclick = () => Draw(false);
	New_Value_Cell.appendChild(New_Value_Button);
	Head_Row.appendChild(New_Value_Cell);
	let Variable_Name_Cell = document.createElement('th');
	let Variable_Name = document.createElement('input');
	if (Variable) {
		Variable_Name.setAttribute('data-variable', Variable);
		Variable_Name.value = Variable;
	}
	Variable_Name_Cell.appendChild(Variable_Name);
	Head_Row.appendChild(Variable_Name_Cell);
	Table.appendChild(Head_Row);
	if (!Array.isArray(Values)) Values = [];
	Values.forEach(Draw);
	Draw(false);
	this.Edit.appendChild(Table);
	this.GUI.Navigate(new MGUI.Menu({Escape:this.Menus.Save_Variable},{Escape:{Name:'Abandon Changes',Function:()=>this.Refresh()}},{},{},[]));
	// variable name input
	// variable-value inputs, move and remove
	// new variable value
}
Dynamic_Document_Linker.prototype.Edit_Condition_Mode = async function (Index) {
	this.Edit.innerHTML = '';
	if (Index !== undefined) this.Conditions_Shell_Index = Index;
	let Condition = Number.isInteger(Index) ? this.Conditions_Shell[Index] : {};
	let Variables = await this.Conditions(true);
	let Table = document.createElement('table');
	if (!Variables) {
		return this.GUI.Navigate(new MGUI.Menu({},{},{},{},[{Name:'NO VARIABLES'}]));
	}
	for (let i = 0, o = Object.keys(Variables), l = o.length; i < l; i++) {
		let Row = document.createElement('tr');
		let Variable = document.createElement('td');
		Variable.innerHTML = o[i];
		Row.appendChild(Variable);
		let Selection_Cell = document.createElement('td');
		let Selection = document.createElement('select');
		Selection.setAttribute('data-variable', o[i]);
		if (Variables[o[i]] == null) {
			// create select: True, False, Ignore
			let True = document.createElement('option');
			True.innerHTML = 'True';
			True.value = true;
			Selection.appendChild(True);
			let False = document.createElement('option');
			False.innerHTML = 'False';
			False.value = false;
			Selection.appendChild(False);
			if (o[i] in Condition) Condition[o[i]] ? True.setAttribute('selected', 'selected') : False.setAttribute('selected', 'selected');
		} else for (let i2 = 0, l2 = Variables[o[i]].length; i2 < l2; i2++) {
			let Option = document.createElement('option');
			Option.innerHTML = Variables[o[i]][i2];
			Option.value = Variables[o[i]][i2];
			if (o[i] in Condition && Condition[o[i]] == Variables[o[i]][i2]) Option.setAttribute('selected', 'selected');
			Selection.appendChild(Option);
		}
		let Ignore = document.createElement('option');
		Ignore.innerHTML = '[ignore]';
		Ignore.value = 'null';
		if (!(o[i] in Condition)) Ignore.setAttribute('selected', 'selected');
		Selection.appendChild(Ignore);
		Selection_Cell.appendChild(Selection);
		Row.appendChild(Selection_Cell);
		Table.appendChild(Row);
	}
	this.Edit.appendChild(Table);
	this.GUI.Navigate(new MGUI.Menu({Escape:this.Menus.Save_Condition},{Escape:{Name:'Abandon Changes',Function:()=>this.Refresh()}},{},{},[]));
}
Dynamic_Document_Linker.prototype.Prepare_Menus = function () {
	this.Menus = Object.create(null);
	this.Menus.Unconditional = {
		Name: 'Decondition',
		Function: async () => {
			let Condition = await this.Unconditional(null);
			await this.Unconditional(!Condition);
		}
	};
	this.Menus.Navigate_Up = {
		Name: 'Navigate Up',
		Function: async () => {
			if (this.Save) await this.Save();
			await this.Navigate(true);
			this.Refresh();
		}
	};
	this.Menus.Navigate_Down = {
		Name: 'Navigate Down',
		Function: async () => {
			if (this.Save) await this.Save();
			await this.Navigate();
			this.Refresh();
		}
	};
	this.Menus.Select = {
		Name: 'Select',
		Function: () => this.Select()
	};
	this.Menus.Deselect = {
		Name: 'Deselect',
		Function: () => this.Select()
	};
	this.Menus.Copy = {
		Name: 'Copy',
		Function: () => this.Copy().then(IPC.View_Copy)
	};
	if (!this.Uncontrolled) return;
	this.Menus.Save_Revision = {
		Name: 'Save Changes',
		Function: () => this.Copy(false).then(Contents => IPC.Edit_Save(this.Revision, Contents))
	};
	this.Menus.Publish_Revision = {
		Name: 'Publish this Revision',
		Function: () => {
			this.GUI.Navigate(new MGUI.Menu({
				'y': {
					Name: 'Yes, Publish this Revision',
					Function: async () => IPC.Edit_Publish(this.Revision).then(Escape)
				}
			},{},{},{},[{
				Name: 'Are you certain you want to publish this revision of the document?'
			}]));
		}
	};
	this.Menus.Delete_Revision = {
		Name: 'Delete this Revision',
		Function: () => {
			this.GUI.Navigate(new MGUI.Menu({
				'y': {
					Name: 'Yes, Delete this Revision',
					Function: async () => IPC.Edit_Delete(this.Revision).then(Escape)
				}
			},{},{},{},[{
				Name: 'Are you certain you want to delete this revision of the document?'
			}]));
		}
	};
	this.Menus.Edit_Element = {
		Name: 'Edit Element',
		Function: () => this.Refresh('Edit')
	};
	this.Menus.Paste = {
		Name: 'Paste',
		Function: () => this.Paste()
	};
	this.Menus.Move_Up = {
		Name: 'Move Up',
		Function: () => this.Move(true)
	};
	this.Menus.Move_Down = {
		Name: 'Move Down',
		Function: () => this.Move()
	};
	this.Menus.Remove = {
		Name: 'Remove Element',
		Function: () => this.Remove()
	};
	this.Menus.New_Next = {
		Name: 'New Element After',
		Function: async () => {
			if (this.Save) await this.Save();
			await this.Add();
			await this.Navigate();
			this.Refresh();
		}
	};
	this.Menus.New_Previous = {
		Name: 'New Element Before',
		Function: async () => {
			if (this.Save) await this.Save();
			await this.Add(true);
			this.GUI.Navigate(false);
			this.Refresh();
		}
	};
	this.Menus.New_Image = {
		Name: 'New Image',
		Function: async () => {
			if (this.Save) await this.Save();
			await this.Add(false, 'Image');
			await this.Navigate();
			this.Refresh();
		}
	};
	this.Menus.Image_Source = {
		Name: 'Image Source',
		Function: () => {
			this.GUI.Navigate(new MGUI.Menu({
				'1': {
					Name: 'Uncontrolled Figures',
					Function: () => {
						this.Edit.innerHTML = '';
						this.Draw_Input_Uncontrolled_Figures();
						this.GUI.Navigate(false);
					}
				},
				'2': {
					Name: 'Controlled Figures',
					Function: () => {
						this.Edit.innerHTML = '';
						this.Draw_Input_Controlled_Figures();
						this.GUI.Navigate(false);
					}
				},
				'3': {
					Name: 'New Upload',
					Function: () => {
						this.Edit.innerHTML = '';
						this.Draw_Input_New_Figure();
						this.GUI.Navigate(false);
					}
				}
			},{},{},{},[]));
		}
	};
	this.Menus.New_Table = {
		Name: 'New Table',
		Function: async () => {
			if (this.Save) await this.Save();
			await this.Add(false, 'Table');
			await this.Navigate();
			this.Refresh();
		}
	};
	this.Menus.View_Mode = {
		Name: 'Escape',
		Function: async () => {
			if (this.Save) await this.Save();
			this.Refresh('View');
		}
	};
	this.Menus.Abandon = {
		Name: 'Abandon Changes',
		Function: () => this.Refresh('View')
	};
	this.Menus.Table_Column_Right = {
		Name: 'Insert Column Right',
		Function: async () => {
			let Shell = await this.Save_Table(true);
			let Row = document.activeElement.getAttribute('data-row');
			if (Row === null) Row = 0;
			else Row = Number(Row);
			let Column = document.activeElement.getAttribute('data-col');
			if (Column === null) Column = 0;
			else Column = Number(Column);
			Shell.forEach(Row => Row.splice(Column + 1, 0, ''));
			this.Edit.innerHTML = '';
			this.Draw_Input_Table(Shell, Column + 1, Row);
		}
	}
	this.Menus.Table_Column_Left = {
		Name: 'Insert Column Left',
		Function: async () => {
			let Shell = await this.Save_Table(true);
			let Row = document.activeElement.getAttribute('data-row');
			if (Row === null) Row = 0;
			else Row = Number(Row);
			let Column = document.activeElement.getAttribute('data-col');
			if (Column === null) Column = 0;
			else Column = Number(Column);
			Shell.forEach(Row => Row.splice(Column, 0, ''));
			this.Edit.innerHTML = '';
			this.Draw_Input_Table(Shell, Column, Row);
		}
	}
	this.Menus.Table_Row_Above = {
		Name: 'Insert Row Above',
		Function: async () => {
			let Shell = await this.Save_Table(true);
			let Row = document.activeElement.getAttribute('data-row');
			if (Row === null) Row = 0;
			else Row = Number(Row);
			let Column = document.activeElement.getAttribute('data-col');
			if (Column === null) Column = 0;
			else Column = Number(Column);
			Shell.splice(Row, 0, Array(Shell[0].length).fill(''));
			this.Edit.innerHTML = '';
			this.Draw_Input_Table(Shell, Column, Row);
		}
	}
	this.Menus.Table_Row_Below = {
		Name: 'Insert Row Below',
		Function: async () => {
			let Shell = await this.Save_Table(true);
			let Row = document.activeElement.getAttribute('data-row');
			if (Row === null) Row = 0;
			else Row = Number(Row);
			let Column = document.activeElement.getAttribute('data-col');
			if (Column === null) Column = 0;
			else Column = Number(Column);
			Shell.splice(Row + 1, 0, Array(Shell[0].length).fill(''));
			this.Edit.innerHTML = '';
			this.Draw_Input_Table(Shell, Column, Row + 1);
		}
	}
	this.Menus.Table_Remove_Column_Right = {
		Name: 'Remove Column Right',
		Function: async () => {
			let Shell = await this.Save_Table(true);
			let Row = document.activeElement.getAttribute('data-row');
			if (Row === null) Row = 0;
			else Row = Number(Row);
			let Column = document.activeElement.getAttribute('data-col');
			if (Column === null) return;
			else Column = Number(Column);
			Shell.forEach(Row => Row.splice(Column + 1, 1));
			this.Edit.innerHTML = '';
			this.Draw_Input_Table(Shell, Column, Row);
		}
	}
	this.Menus.Table_Remove_Column_Left = {
		Name: 'Remove Column Left',
		Function: async () => {
			let Shell = await this.Save_Table(true);
			let Row = document.activeElement.getAttribute('data-row');
			if (Row === null) Row = 0;
			else Row = Number(Row);
			let Column = document.activeElement.getAttribute('data-col');
			if (Column === null) return;
			else Column = Number(Column);
			if (Column > 0) Shell.forEach(Row => Row.splice(Column - 1, 1));
			this.Edit.innerHTML = '';
			this.Draw_Input_Table(Shell, Column - 1, Row);
		}
	}
	this.Menus.Table_Remove_Row_Above = {
		Name: 'Remove Row Above',
		Function: async () => {
			let Shell = await this.Save_Table(true);
			let Row = document.activeElement.getAttribute('data-row');
			if (Row === null) Row = 0;
			else Row = Number(Row);
			let Column = document.activeElement.getAttribute('data-col');
			if (Column === null) return;
			else Column = Number(Column);
			if (Row > 0) Shell.splice(Row - 1, 1);
			this.Edit.innerHTML = '';
			this.Draw_Input_Table(Shell, Column, Row - 1);
		}
	}
	this.Menus.Table_Remove_Row_Below = {
		Name: 'Remove Row Below',
		Function: async () => {
			let Shell = await this.Save_Table(true);
			let Row = document.activeElement.getAttribute('data-row');
			if (Row === null) Row = 0;
			else Row = Number(Row);
			let Column = document.activeElement.getAttribute('data-col');
			if (Column === null) return;
			else Column = Number(Column);
			Shell.splice(Row +1, 1);
			this.Edit.innerHTML = '';
			this.Draw_Input_Table(Shell, Column, Row);
		}
	};
	this.Menus.New_Variable = {
		Name: 'New Variable',
		Function: () => this.Edit_Variable_Mode()
	};
	this.Menus.Save_Variable = {
		Name: 'Save Variable',
		Function: async () => {
			await this.Save_Variable()
			this.Refresh();
		}
	};
	this.Menus.Edit_Variable = {
		Name: 'Edit Variable',
		Function: async () => {
			let Conditions = await this.Conditions();
			let Shell = [{}, {}, {}, {}, []];
			if (Conditions) Object.keys(Conditions).forEach(Condition => {
				let ShellB = {};
				ShellB.Name = Condition;
				ShellB.Function = () => this.Edit_Variable_Mode(Condition, Conditions[Condition]);
				Shell[4].push(ShellB);
			});
			let Menu = new MGUI.Menu(...Shell);
			this.GUI.Navigate(Menu);
		}
	}
	this.Menus.Delete_Variable = {
		Name: 'Delete Variable',
		Function: async () => {
			let Conditions = await this.Conditions();
			let Shell = [{}, {}, {}, {}, []];
			if (Conditions) Object.keys(Conditions).forEach(Condition => {
				let ShellB = {};
				ShellB.Name = Condition;
				ShellB.Function = () => {
					this.Remove_Condition(Condition);
					this.Refresh();
				}
				Shell[4].push(ShellB);
			});
			let Menu = new MGUI.Menu(...Shell);
			this.GUI.Navigate(Menu);
		}
	}
	this.Menus.Condition_Element = {
		Name: 'Condition Element',
		Function: async () => this.Refresh('Condition')
	};
	this.Menus.New_Condition = {
		Name: 'New Condition',
		Function: async () => {
			await this.Edit_Condition_Mode();
		}
	};
	this.Menus.Remove_Condition = {
		Name: 'Remove Condition',
		Function: async () => {
			let Conditions = this.Conditions_Shell;
			let Shell = [{}, {}, {}, {}, []];
			if (Conditions) for (let i = 0, l = Conditions.length; i < l; i++) {
				let ShellB = {};
				ShellB.Name = 'Remove Condition ' + i;
				ShellB.Function = async () => {
					this.Conditions_Shell.splice(i, 1);
					this.Refresh();
				}
				Shell[4].push(ShellB);
			} else return;
			let Menu = new MGUI.Menu(...Shell);
			this.GUI.Navigate(Menu);
		}
	};
	this.Menus.Edit_Condition = {
		Name: 'Edit Condition',
		Function: async () => {
			let Conditions = this.Conditions_Shell;
			let Shell = [{}, {}, {}, {}, []];
			if (Conditions) for (let i = 0, l = Conditions.length; i < l; i++) {
				let ShellB = {};
				ShellB.Name = 'Edit Condition ' + i;
				ShellB.Function = async () => {
					this.Edit_Condition_Mode(i);
				}
				Shell[4].push(ShellB);
			} else return;
			let Menu = new MGUI.Menu(...Shell);
			this.GUI.Navigate(Menu);
		}
	};
	this.Menus.Save_Condition = {
		Name: 'Save Condition',
		Function: async () => {
			this.Save_Condition();
			this.Refresh();
		}
	};
}
Dynamic_Document_Linker.prototype.Modes = ['View', 'Edit', 'Condition'];
/////////////////////////// HERE BE MONSTERS //////////////////////////////////
/*
Dynamic_Document_Linker.prototype.Toggle_Edit = function (Visible) {}
Dynamic_Document_Linker.prototype.Toggle_View = function (Visbile) {}

// MGUI VIEWING
//  -- (document to select mode)
//  -- decondition
//  -- navigate up
//  -- navigate down
//  -- select/deselect
//  -- copy selection
//
// MGUI EDITING
//  -- (document to navigate mode)
//  -- paste after element ??
//  -- navigate up
//  -- navigate down
//  -- move up
//  -- move down
//  -- nested move ??
//  -- change type
//  -- [input] text, image src, table editor
//  -- remove element
//  -- escape editing
//  -- push changes to the document ??
//
// MGUI META
//  -- document title
//  -- variable editing engine
//
// QUESTIONS
//  -- how will table editing work
//  -- how will variable editing work
//  -- how will changes be pushed (concerning the undo/redo log)
//  -- how will pasting to multiple locations work
//
// variables need special functionality to protect from:
//   propegating the update of values across the conditioned elements
//   automatically removing conditions relating to remove variables or values
//
*/
if (typeof module !== 'undefined' && module.exports) module.exports = Dynamic_Document_Linker;
