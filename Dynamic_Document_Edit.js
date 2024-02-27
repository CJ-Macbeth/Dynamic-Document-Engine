const Dynamic_Document_Editor = function (Dynamic_Document) {
	// class for editing dynamic documents

	this.Dynamic_Document = Dynamic_Document; // an instance of the Dynamic_Document_View class
}
Dynamic_Document_Editor.prototype.API = function (Command, Options) {
	// main interface for other scripts to interact with

	switch (Command) {
		case 'Add Condition':
			return this.Add_Condition(Options.Name, Options.Values);
		case 'Modify Condition':
			return this.Modify_Condition(Options.Name, Options.Rename, Options.Values);
		case 'Move Condition':
			return this.Move_Condition(Options.List);
		case 'Remove Condition':
			return this.Remove_Condition(Options);
		case 'Condition':
			return this.Condition(this.Dynamic_Document.Waypoint, Options);
		case 'Add':
			return this.Add(Options.Data, Options.Target);
		case 'Modify':
			return this.Modify(Options);
		case 'Move':
			return this.Move(Options);
		case 'Remove':
			return this.Remove(Options);
		case 'Paste':
			return this.Paste(Options);
		default:
			return this.Dynamic_Document.API(Command, Options);
	}
}
Dynamic_Document_Editor.prototype.Add_Condition = function (Name, Values) {
	// create a new variable and append to the list
	let New_Variable = Dynamic_Document_Editor.Draw_Variable(Name, Values);
	this.Dynamic_Document.Container.getElementsByClassName('Meta')[0].insertAdjacentHTML('beforeend', New_Variable);
	this.Dynamic_Document.Render();
}
Dynamic_Document_Editor.prototype.Modify_Condition = function (Name, Rename, Values) {
	// update the given variable
	let Variables = this.Dynamic_Document.Conditioning();
	let Variable = Object.keys(Variable => Variable == Name);
	if (!Variable) return false; // throw err?
	let New_Variable = Dynamic_Document_Editor.Draw_Variable(Rename, Values ? Object.keys(Values): null);
	this.Dynamic_Document.Container.querySelector(`.Variable[data-variable="${Name}"]`).outerHTML = New_Variable;
	return true;
	// how will this replace the element in the document?
}
Dynamic_Document_Editor.prototype.Move_Condition = function (Variables) {
	// change the order of the variables to match the given list order
	let Meta = this.Dynamic_Document.Container.querySelector('.Meta').children[0];
	Meta.after(...Variables.map(Variable => this.Dynamic_Document.Container.querySelector(`.Variable[data-variable="${Variable}"]`)).filter(Element => Element !== null));
	return true;
	// any unreferenced elements remain at the end of the list
}
Dynamic_Document_Editor.prototype.Remove_Condition = function (Name) {
	// simply remove the given variable from the document
	this.Dynamic_Document.Container.querySelector(`.Variable[data-variable="${Name}"]`).remove();
	return true;
}
Dynamic_Document_Editor.prototype.Condition = function (Target, Conditions) {
	// generate a new condition list (replacing the existing) for the given element
	let Old_Conditions = [...this.Dynamic_Document.Index[Target].getElementsByClassName('Condition')];
	Old_Conditions.forEach(Condition => Condition.remove());
	let New_Conditions = Dynamic_Document_Editor.Draw_Conditions(Conditions);
	this.Dynamic_Document.Index[Target].insertAdjacentHTML('beforeend', New_Conditions);
	return true;
}
Dynamic_Document_Editor.prototype.Add = function (Options, Target) {
	// check/err element creation
	// check/err target selection
	if (typeof Target == 'boolean') Target = Target ? this.Dynamic_Document.Waypoint - 1 : this.Dynamic_Document.Waypoint;
	if (!Number.isInteger(Target) || Target < 0 || Target > this.Dynamic_Document.Index.length - 1) return false; // throw err here instead?
	let Shell = Dynamic_Document_Editor.Draw(Options);
	this.Dynamic_Document.Index[Target].insertAdjacentHTML('afterend', Shell);
	this.Dynamic_Document.Render();
}
Dynamic_Document_Editor.prototype.Modify = function (Options) {
	// validate inputs
	let Shell = this.Dynamic_Document.Copy(true);
	for (let i = 0, o = Object.keys(Options), l = o.length; i < l; i++) Shell[o[i]] = Options[o[i]];
	let Drawing = Dynamic_Document_Editor.Draw(Shell);
	let Conditions = (this.Dynamic_Document.Waypoint == 0) ? [...this.Dynamic_Document.Index[this.Dynamic_Document.Waypoint].getElementsByClassName('Variable')] : [...this.Dynamic_Document.Index[this.Dynamic_Document.Waypoint].getElementsByClassName('Condition')];
	let Current_Element = this.Dynamic_Document.Index[this.Dynamic_Document.Waypoint];
	Current_Element.insertAdjacentHTML('afterend', Drawing);
	let New_Element = Current_Element.nextSibling;
	New_Element.append(...Conditions);
	Current_Element.remove();
	this.Dynamic_Document.Render();
}
Dynamic_Document_Editor.prototype.Move = function (Up, Nested) {// (Numbering, Target, Nested) {
	// check/err
	
	if (Up && this.Dynamic_Document.Waypoint < 2) return;
	else if (!Up && this.Dynamic_Document.Waypoint == this.Dynamic_Document.Index.length - 1) return;
	let Waypoint = this.Dynamic_Document.Waypoint;
	let Element = this.Dynamic_Document.Container.getElementsByClassName('Element')[Waypoint];
	if (Up) Element.parentNode.insertBefore(Element, Element.previousElementSibling);
	else Element.parentNode.insertBefore(Element.nextElementSibling, Element);
	Up ? this.Dynamic_Document.Waypoint-- : this.Dynamic_Document.Waypoint++;
	this.Dynamic_Document.Render();

	/*let Numbering_Array = Numbering.match(/(\d+)/g);
	let Level = Numbering_Array.length;
	let Numberings = Object.keys(this.Dynamic_Document.Map);
	let Start = Numberings.findIndex(Numbering);
	let End = Numberings.length - 1;
	if(Nested) for (let i = Start + 1, l = Numberings.length; i < l; i++){
		let numbering_array = Numberings[i].match(/(\d+)/g);
		if(numbering_array.length > Level || Level == 4) continue;
		End = i;
		break;
	} else End = Start + 1;
	let Selection = this.Dynamic_Document.Map.slice(Start, End);
	Selection.forEach(Element => this.Dynamic_Document.Container.removeChild(Element));
	this.Dynamic_Document.Map[Target].after(...Selection);
	this.Dynamic_Document.Render();*/
}
Dynamic_Document_Editor.prototype.Remove = function (Target) {
	// check/err
	if (Target === undefined) Target = this.Dynamic_Document.Waypoint;
	if (Target == 0) return false;
	this.Dynamic_Document.Container.children[Target].remove()
	this.Dynamic_Document.Render();
}
Dynamic_Document_Editor.prototype.Paste = function (Elements) {
	// check and err if targets in this.Dynamic_Document.Map
	// check/err all elements get created successfully
	// how will inserting elements effect the selected elements?
	// { Elements, Source }
	let Shell = [];
	let Targets = this.Dynamic_Document.Selections();
	if (Array.isArray(Elements)) for (let i = 0, l = Elements.length; i < l; i++) Shell.push(Dynamic_Document_Editor.Draw(Elements[i])); // handling bad inputs
	else Shell.push(Dynamic_Document_Editor.Draw(Elements));
	if (Targets.length == Shell.length) for (let i = 0, l = Targets.length; i < l; i++) this.Dynamic_Document.Index[Targets[i]].insertAdjacentHTML('afterend', Shell[i]);
	else for (let i = 0, l = Target.length; i < l; i++) this.Dynamic_Document.Index[Targets[i]].insertAdjacentHTML('afterend', Shell.join(''));
	this.Dynamic_Document.Render();
}
Dynamic_Document_Editor.Draw_Variable = function (Name, Values) {
	if (!Values) return `<table class="Variable" data-variable="${Name}"><tr><th>
		<input type="checkbox" name="${Name}" value="${Name}" id="${Name}_Boolean">
		<label for="${Name}_Boolean" class="Variable_Name">${Name}</label>
		</th></tr></table>`;
	else {
		let HTML = `<table class="Variable" data-variable="${Name}"><tr><th class="Variable_Name">${Name}</th></tr>`;
		Values.forEach(Value => HTML += `<tr><td><input type="Radio" name="${Name}" value="${Value}" id="${Name}_${Value}"><label for="${Name}_${Value}">${Value}</label></td></tr>`);
		HTML += '</table>';
		return HTML;
	}
}
Dynamic_Document_Editor.Draw_Conditions = function (Conditions) {
	let HTML = '';
	Conditions.forEach(Condition => {
		HTML += '<div class="Condition">';
		Object.keys(Condition).forEach(Variable => HTML += `<div><div>${Variable}</div><div>${Condition[Variable]}</div></div>`);
		HTML += '</div>';
	});
	return HTML;
}
Dynamic_Document_Editor.Draw = function (Options) {
	let HTML = `<div class="Element ${Options.Type}">`;
	HTML += this.Draw[Options.Type](Options);
	//HTML += Options.Type == 'Meta' ? this.Draw.Variables(Options.Variables) : this.Draw.Conditions(Options.Conditions);
	HTML += '</div>';
	return HTML;
}
Dynamic_Document_Editor.Draw.Meta = Options => `<h1>${Options.Text ? Options.Text : 'UNTITLED'}</h1>`;
Dynamic_Document_Editor.Draw.Section = Options => `<h2>${Options.Text ? Options.Text : 'UNNAMED SECTION'}</h2>`;
Dynamic_Document_Editor.Draw.Subsection = Options => `<h3>${Options.Text ? Options.Text : 'UNNAMED SUBSECTION'}</h3>`;
Dynamic_Document_Editor.Draw.Step = Options => `<h4>${Options.Text ? Options.Text : 'UNNAMED STEP'}</h4>`;
Dynamic_Document_Editor.Draw.Instruction = Options => `<p>${Options.Text ? Options.Text : 'EMPTY INSTRUCTION'}</p>`;
Dynamic_Document_Editor.Draw.Tooltip = Options => `<p>${Options.Text ? Options.Text : 'EMPTY TOOLTIP'}</p>`;
Dynamic_Document_Editor.Draw.Counterinstruction = Options => `<p>${Options.Text ? Options.Text : 'EMPTY COUNTERINSTRUCTION'}</p>`;
Dynamic_Document_Editor.Draw.Table = Options => {
	if (!Options.Table) Options.Table = [[]];
	let HTML = '<table><tr>';
	for (let i = 0, l = Options.Table[0].length; i < l; i++) HTML += `<th>${Options.Table[0][i] ? Options.Table[0][i] : ''}</th>`;
	HTML += '</tr>';
	for (let i = 1, l = Options.Table.length; i < l; i++) {
		HTML += '<tr>';
		for (let i2 = 0, l2 = Options.Table[i].length; i2 < l2; i2++) HTML += `<td>${Options.Table[i][i2] ? Options.Table[i][i2] : ''}</td>`;
		HTML += '</tr>';
	}
	HTML += '</table>';
	return HTML;
}
Dynamic_Document_Editor.Draw.Image = Options => `<img src="${Options.Image ? Options.Image : ''}" />`; // fix to reference lost figure (hard code to main, Figure-0?
Dynamic_Document_Editor.Draw.Conditions = Conditions => ``; // FIX
