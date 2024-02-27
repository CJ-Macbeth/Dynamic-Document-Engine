const Dynamic_Document_Viewer = function (Element, Resize, Alert) {
	// Dynamic Document class, manages the document's dynamic functionality (variables, numbering, selection)

	this.Container = Element; // the html element that contains the document
	this.Application_Mode = false;
	if (typeof Alert == 'function') this.Alert = Alert;
	else this.Alert = () => {};
	this.Conditions = Object.create(null); // houses the active/selected values of each variable
	this.Map = Object.create(null); // the currently visible elements, by their numbering
	this.Index = []; // all elements currenlty in the document, by their index (tolerant to change in variable selection)
	this.Selected = new Set() // the currently selected elements by their index (tolerant to change in variable selection)
	this.Waypoint = null; // the element currently navigated to, if viewed in the editor
	this.Unconditional = false; // unconditional mode, used in editing, where variable selection is ignored
	if (Resize) Resize.addEventListener('mousedown', event => {
		document.addEventListener('mousemove', this.Resize, false);
		document.addEventListener('mouseup', event => {
			document.removeEventListener('mousemove', this.Resize, false);
		});
	});
	this.Render();
}
Dynamic_Document_Viewer.prototype.API = function (Command, Options) {
	// main interface for other scripts to interact with

	switch (Command) {
		case 'Unconditional':
			this.Application_Mode = true;
			if (Options === null) return this.Unconditional;
			else {
				this.Unconditional = Options ? true : false;
				this.Render();
				return true;
			}
		case 'Waypoint':
			return this.Waypoint;
		case 'Navigate':
			return this.Navigate(Options);
		case 'Conditions':
			return this.Conditioning(Options);
		case 'Copy':
			return this.Copy(Options);
		case 'Select':
			return this.Select();
		case 'Selections':
			return this.Selections();
		default:
			throw new Error(`Unrecognized Command: ${Command}`);
	}
}
Dynamic_Document_Viewer.prototype.Navigate = function (Waypoint) {
	// changes the waypoint, which holds the index of the currently selected element

	// !!! FIX: only navugate to VISIBLE ELEMENTS

	if (this.Waypoint === null)this.Waypoint = 0;
	if (Waypoint === null) this.Waypoint = null;
	else if (Waypoint === true && this.Waypoint > 0) this.Waypoint--;
	else if ((Waypoint === undefined || Waypoint === false) && this.Waypoint < (this.Index.length - 1)) this.Waypoint++;
	this.Render();
	return this.Waypoint;
}
Dynamic_Document_Viewer.prototype.Resize = function (event) {
	// used by the event listener to allow the user to drag the right edge to resize the document

	let container = this.Container.getBoundingClientRect();
	// get the distance between the left edge of the document container and the mouse, and translate it to rem units
	let result = ((event.x / 53 / 16) - container.left).toFixed(2);
	this.Container.style.fontSize = (result > 10 ? result : 10 + 'rem');
}
Dynamic_Document_Viewer.prototype.Condition = function () {
	// updates the variable selections, used before this.Render()

	let variables = this.Container.getElementsByClassName('Variable');
	let conditions = Object.create(null);
	// generate the list of the current variables and thier values:
	for (let i=0, l = variables.length; i < l; i++) {
		let Variable = null;
		let Value = null;
		if (variables[i].querySelector('input[type="checkbox"]')){
			let Target = variables[i].getElementsByTagName('input')[0];
			Variable = Target.getAttribute('name');
			Value = Target.checked;
		} else {
			let Target = variables[i].querySelector('input:checked');
			if (!Target) {
				variables[i].getElementsByTagName('input')[0].checked = true;
				Target = variables[i].querySelector('input:checked');
			}
			Variable = Target.getAttribute('name');
			Value = Target.value;
		}
		this.Conditions[Variable] = Value;
		conditions[Variable] = Value;
	}
	// remove vesitigial variable-value pairs (only necessary when editing the document's variables)
	for (let i = 0, o = Object.keys(this.Conditions), l = o.length; i<l; i++) if (!o[i] in conditions) delete this.Conditions[o[i]];
}
Dynamic_Document_Viewer.prototype.Evaluate = function (Conditions) {
	// evaluates the given conditions against the currently selected variable-values

	if (!Conditions || Conditions.length == 0) return true;
	else return Conditions.some(condition => {
		let variables = Object.keys(condition);
		return variables.every(variable => condition[variable] == this.Conditions[variable]);
	});

	/* 
	an element's conditions array acts like many AND gates connected to one OR
	gate, if all variable-value pairs listed in any object in the condition
	array match those selected, then the element should be displayed, so the
	function returns true, if none of the objects contain all valid variable-
	value pairs, the element should not be displayed, and the function returns
	false, if there is no array, the element is unconditioned, and is displayed.
	*/
}
Dynamic_Document_Viewer.prototype.Render = function (Unconditional) {
	// updates the document to reflect the variable selections and updates the numbering
	// - most of the work is done here, called every time there is any change in the document or variable selections

	if (typeof Unconditional == 'boolean') this.Unconditional  = Unconditional;
	[...this.Container.getElementsByClassName('Sticky-Banner-Warning')].forEach(Element => Element.remove());
	if (this.Application_Mode && !this.Unconditional) {
		// create the banner warning of unconditional state here?
		let Banner = document.createElement('div');
		Banner.innerHTML = 'CONDITIONAL MODE';
		Banner.setAttribute('class', 'Sticky-Banner-Warning');
		this.Container.children[0].before(Banner);
	}
	this.Condition(); // prepares the var-vals for use in rendering?

	// rewrite selection to make selections in set appear in the order they occur in the document,
	//   or make sure that when called, they return that way to the parent window
	this.Selected = new Set([... this.Selected].filter(element => {
		return (element instanceof HTMLElement && this.Container.contains(element));
	}));

	//Object.keys(this.Map).forEach(numbering => delete this.Map[numbering]); // clears the map so it can be remade
	this.Map = Object.create(null); // clears the map so it can be remade

	// remove all the numbers elements
	let numbers = this.Container.getElementsByClassName('Number');
	if (numbers) while (numbers.length > 0) numbers[0].remove();
	
	// make sure all images open onclick
	let Images = this.Container.getElementsByTagName('img');
	
	// this removes the onclick event listeners, so they can be readded cleanly each refresh
	[...this.Container.getElementsByTagName('img')].forEach(Image => Image.outerHTML = Image.outerHTML);

	// readd the onclick event listeners (to expand the images)
	[...this.Container.getElementsByTagName('img')].forEach(Image => Image.addEventListener('click', E => {
		E.stopPropagation();
		this.Open_Image(Image);
	}));

	// change the Image locations and hover and click settings
	if (this.Application_Mode) {
		this.Container.classList.add('Active');
		// switch image locations to direct
		[...this.Container.getElementsByTagName('img')].forEach(Image => {
			if (Image.getAttribute('src').match(/^Uncontrolled_Figures/)) Image.setAttribute('src', Image.getAttribute('src').substring(20));
			else if (Image.getAttribute('src').match(/^Figures/)) Image.setAttribute('src', Image.getAttribute('src').substring(8));
		});
	} else {
		this.Container.classList.remove('Active');
		// switch image locations to folder reference
		[...this.Container.getElementsByTagName('img')].forEach(Image => {
			if (Image.getAttribute('src').match(/^UNCONTROLLED/)) Image.setAttribute('src', 'Uncontrolled_Figures/' + Image.getAttribute('src'));
			else if (Image.getAttribute('src').match(/^FIGURE/)) Image.setAttribute('src', 'Figures/' + Image.getAttribute('src'));
		});
	}

	// create the list of elements to iterate over, and hide/prepare
	this.Index = [...this.Container.getElementsByClassName('Element')];
	let elements = [...this.Index];

	let Numbering = [0, 0, 0, 0];
	for (let i = 0, l = elements.length; i < l; i++) {
		elements[i].classList.remove('Waypoint');
		let display = this.Unconditional ? true : this.Evaluate([...elements[i].getElementsByClassName('Condition')].map(Element => {
			let Shell = {};
			[...Element.children].forEach(Pair => Shell[Pair.children[0].innerHTML] = Pair.children[1].innerHTML);
			Object.keys(Shell).forEach(Key => {
				if (typeof this.Conditions[Key] == 'boolean') Shell[Key] = Shell[Key] == 'true' ? true : false;
			});
			return Shell;
		}).filter(Condition => typeof Condition == 'object' && Object.keys(Condition).length > 0));
		if(!display) elements[i].style.display = 'none';
		else {
			elements[i].onclick = E => {
				if (E.shiftKey) {
					this.Select(i);
				} else {
					if (this.Waypoint == i) this.Waypoint = null;
					else this.Waypoint = i;
					this.Render();
					this.Alert();
				}
			}
			elements[i].style.display = 'block';
			let Type = 'Instruction';
			if (elements[i].classList.contains('Meta')) Type = 'Meta';
			else if (elements[i].classList.contains('Section')) Type = 'Section';
			else if (elements[i].classList.contains('Subsection')) Type = 'Subsection';
			else if (elements[i].classList.contains('Step')) Type = 'Step';
			else if (elements[i].classList.contains('Image')) Type = 'Image';
			else if (elements[i].classList.contains('Table')) Type = 'Table';
			else if (elements[i].classList.contains('Tooltip')) Type = 'Tooltip';
			else if (elements[i].classList.contains('Counterinstruction')) Type = 'Counterinstruction';
			let numbering = document.createElement('span');
			numbering.setAttribute('class', 'Number');
			switch (Type) {
				case 'Meta':
					numbering.classList.add('Num_Meta');
					numbering.innerHTML = '0.0.0';
					elements[i].append(numbering);
					break;
				case 'Section':
					numbering.classList.add('Num_Sec');
					Numbering[0]++;
					Numbering[1] = 0;
					Numbering[2] = 0;
					Numbering[3] = 0;
					numbering.innerHTML = Numbering[0] + '.0.0';
					elements[i].append(numbering);
					break;
				case 'Subsection':
					Numbering[1]++;
					Numbering[2] = 0;
					Numbering[3] = 0;
					numbering.innerHTML = Numbering[0] + '.' + Numbering[1] + '.0';
					elements[i].append(numbering);
					break;
				case 'Step':
					Numbering[2]++;
					Numbering[3] = 0;
					numbering.innerHTML = Numbering[0] + '.' + Numbering[1] + '.' + Numbering[2];
					elements[i].append(numbering);
					break;
				case 'Image':
					numbering.innerHTML = 'I ';
					Numbering[3]++;
					numbering.innerHTML += Numbering[0] + '.' + Numbering[1] + '.' + Numbering[2] + '.' + Numbering[3];
					elements[i].append(numbering);
					break;
				case 'Table':
					numbering.classList.add('Inline');
					numbering.innerHTML = 'T ';
					Numbering[3]++;
					numbering.innerHTML += Numbering[0] + '.' + Numbering[1] + '.' + Numbering[2] + '.' + Numbering[3];
					elements[i].getElementsByTagName('table')[0].lastChild.after(numbering);
					break;
				default:
					numbering.classList.add('Inline');
					Numbering[3]++;
					numbering.innerHTML += Numbering[0] + '.' + Numbering[1] + '.' + Numbering[2] + '.' + Numbering[3];
					elements[i].append(numbering);
					break;
			}
			if (this.Selected.has(elements[i])) elements[i].classList.add('Selected');
			else elements[i].classList.remove('Selected');
			this.Map[numbering.innerHTML] = elements[i];
		}
	}
	if (this.Waypoint !== null && this.Waypoint >= this.Index.length) this.Waypoint = this.Index.length - 1;
	if (this.Waypoint !== null) this.Index[this.Waypoint].classList.add('Waypoint');
}
Dynamic_Document_Viewer.prototype.Select = function (All) {
	// used by editors to select elements for copying, or for saving the document
	if (All === true) {
		if (this.Selected.size == this.Index.length) this.Selected.clear();
		else Object.keys(this.Map).forEach(numbering => this.Selected.add(this.Map[numbering]));
	} else {
		let Target = typeof All == 'number' ? All : this.Waypoint;
		if (Target < 0 || Target >= this.Index.length) return;
		if (!this.Selected.has(this.Index[Target])) this.Selected.add(this.Index[Target]);
		else this.Selected.delete(this.Index[Target]);
	}
	this.Render(this.Unconditional);
	return true;
}
Dynamic_Document_Viewer.prototype.Selections = function () {
	return [...this.Selected].map(Element => {
		return this.Index.indexOf(Element);
	});
}
Dynamic_Document_Viewer.prototype.Conditioning = function (Meta) {
	// generate and return the current list of conditions
	// get the conditions associated with the current element
	// or get the document variables
	let Shell = null;
	if (Meta || this.Waypoint == 0) {
		let variables = this.Container.getElementsByClassName('Variable');
		let ShellB = Object.create(null);
		for (let i=0, l = variables.length; i < l; i++) {
			let Variable = variables[i].getElementsByClassName('Variable_Name')[0].innerHTML;
			let Values = variables[i].getElementsByTagName('input');
			if (Values.length == 1) ShellB[Variable] = null;
			else ShellB[Variable] = [...Values].map(Element => Element.value);
		}
		if (Object.keys(ShellB).length > 0) Shell = ShellB;
		// <table class="Variable">
		// <tr><th class="Variable_Name">Variable</th></tr>
		// <tr><td><input type="radio" name="Variable" value="Value" id="Variable_Value" /><label for="Variable_Value">Value</Value></td></tr>
		// </table>
		//
		// or
		//
		// <table class="Variable">
		// <tr><th><input type="checkbox" value="Variable" id="Variable_Bool"><label for="Variable_Bool" class="Variable_Name">Variable</label></th></tr>
		// </table>
	} else {
		let Element = this.Index[this.Waypoint];
		let Conditions = [...Element.getElementsByClassName('Condition')];
		let ShellB = [];
		Conditions.forEach(Condition => {
			let ShellC = {};
			[...Condition.children].forEach(Pair => {
				ShellC[Pair.children[0].innerHTML] = Pair.children[1].innerHTML;
			});
			ShellB.push(ShellC);
		});
		Shell = ShellB;
		// <div class="Condition">
		//   <div>
		//     <div> Variable </div>   <div> Value </div>
		//   </div>
		// </div>
	}
	return Shell;
}
Dynamic_Document_Viewer.prototype.Copy = function (Waypoint) {
	// waypoint is either true or falsy
	// turns the selected elements into JSON, to be transferred between documents (copying)
	let Shell;
	if (Waypoint === false) return this.Container.outerHTML;
	else if (Waypoint === true) {
		if (this.Waypoint === null) {
			this.Waypoint = 0;
			this.Render();
		}
		Shell = this.Export_Element(this.Index[this.Waypoint]);
	} else if (typeof Waypoint == 'number') Shell = this.Export_Element(this.Index[Waypoint]);
	else Shell = [...this.Selected].filter(Element => {
		let Style = window.getComputedStyle(Element);
		return Style.display == 'none';
	}).map(this.Export_Element); // filter by visibility :)
	return Shell;
}
Dynamic_Document_Viewer.prototype.Export_Element = function (Element) {
	// creates an object representation of the selected element, for export

	let ShellB = Object.create(null);
	if (Element.classList.contains('Meta')) ShellB.Type = 'Meta';
	else if (Element.classList.contains('Section')) ShellB.Type = 'Section';
	else if (Element.classList.contains('Subsection')) ShellB.Type = 'Subsection';
	else if (Element.classList.contains('Step')) ShellB.Type = 'Step';
	else if (Element.classList.contains('Image')) ShellB.Type = 'Image';
	else if (Element.classList.contains('Table')) ShellB.Type = 'Table';
	else if (Element.classList.contains('Tooltip')) ShellB.Type = 'Tooltip';
	else if (Element.classList.contains('Counterinstruction')) ShellB.Type = 'Counterinstruction';
	else ShellB.Type = 'Instruction';
	if (ShellB.Type == 'Table') ShellB.Table = this.Export_Table(Element);
	else if (ShellB.Type == 'Variable') ShellB.Variable = this.Export_Variable(Element);
	else if (ShellB.Type == 'Image') ShellB.Image = Element.currentSrc;
	else ShellB.Text = Element.children[0].innerHTML; // HTLMS
	return ShellB;
}
Dynamic_Document_Viewer.prototype.Export_Table = function (Element) {
	// turns tables into an object for the export function

	let Shell = [];
	let rows = Element.getElementsByTagName('tr');
	for (let i = 0, l = rows.length; i < l; i++) {
		let ShellB = [];
		for (let i2 = 0, l2 = rows[i].children.length; i2 < l2; i2++) ShellB.push(rows[i].children[i2].innerHTML);
		Shell.push(ShellB);
	}
	return Shell;
}
Dynamic_Document_Viewer.prototype.Export_Variable = function (Element) {
	// turns variables into objects for the export function
	
	let Name = Element.getElementsByTagName('th')[0].innerHTML;
	let cells = Element.getElementsByTagName('td');
	let Values = [];
	let Shell = Object.create(null);
	Shell.Name = Name;
	Shell.Values = [];
	for (let i = 0, l = cells.length; i < l; i++) Values.push(cells[i].innerHTML);
	return Shell;

}
Dynamic_Document_Viewer.prototype.Open_Image = function (Image) {
	Image.classList.add('Grey-Image');
	let source = Image.source;
	let Box = document.createElement('div');
	Box.setAttribute('class', 'Open-Image-Box');
	let New = document.createElement('img');
	New.setAttribute('src', Image.getAttribute('src'));
	Box.onclick = () => {
		Box.remove();
		Image.classList.remove('Grey-Image');
	}
	New.setAttribute('class', 'Open-Image');
	Box.appendChild(New);
	this.Container.appendChild(Box);
}
// allows the tool to be used by either server-side (node module) or client-side (javascript source)
if (typeof module !== 'undefined' && module.exports) module.exports = Dynamic_Document_Viewer;
