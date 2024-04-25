/*

how will MGUI work?
- launch against target element
- execute function to load menu or form
- listeners for control keys?

requirements for menu building:
-- unnamed items: negative numbers?
-- hidden keydown submenus: specify key in upper with element
-- unhidden keydown submenus: no upper key specification
-- key and alternate pairings: unhidden display in-order
-- fully customizable menu ordering: following upper-ordering
-- highlighting: always highlight on keydowns and function calls:
	-- returns true: green, false: red, undefined/other: no action

!- automatically load escape
!- func to onclick open control submenus

*/

/*function MGUI(Workspace,NN,NA,CN,CA,XX){
	if(Workspace instanceof Element)this.Workspace=Workspace;
	if(typeof)
	this.Load(false,NN,NA,CN,CA,XX);
	//this.Menu=null;
	//this.State=0;
}*/

/*

MGUI
load
register
anonymous
adjust
move
set

*/

if (typeof module !== "undefined" && module.exports) {
	//const path = require('path');
	const HTMLS = require(path.join(__dirname, 'HTMLS'));
}
const MGUI = function (Workspace) {
	this.Chain = [];
	this.Relocate(Workspace);
	this.State = 0;
	let action = document.createElement('div');
	action.setAttribute('class', 'MGUI-Action  MGUI-Button');
	let name = document.createElement('div');
	name.setAttribute('class', 'MGUI-Action-Name');
	name.innerHTML = 'Escape';
	action.appendChild(name);
	action.Function = () => { this.State > 0 ? this.Submenu(0) : this.Navigate(false)};
	action.setAttribute('tabindex', '0');
	action.setAttribute('onkeypress', 'if(event.key==\'Enter\')this.click()');
	action.addEventListener('click', action.Function);
	let keybinds = document.createElement('div');
	keybinds.setAttribute('class', 'MGUI-Action-Keybinds');
	keybinds.innerHTML = '<div class="MGUI-Action-Keybind">Escape</div></div>';
	action.appendChild(keybinds);
	this.Escape = action;
	this.Sensing = true;
	document.addEventListener('keydown', E => this.Eye(E));
	document.addEventListener('keyup', E => this.Ear(E));
}
MGUI.prototype.Mouth = async function (Element) {
	if (typeof Element.Function != 'function') return;
	let glow = await Element.Function();
	if (glow === true) {
		Element.classList.remove('MGUI-Glow-True');
		Element.classList.add('MGUI-Glow-True');
		setTimeout(() => {
			Element.classList.remove('MGUI-Glow-True');
		}, 1000);
	} else if (glow === false) {
		Element.classList.remove('MGUI-Glow-False');
		Element.classList.add('MGUI-Glow-False');
		setTimeout(() => {
			Element.classList.remove('MGUI-Glow-False');
		}, 1000);
	}
}
MGUI.prototype.Eye = function (E) {
	if (!this.Sensing) return;
	E.stopPropagation();
	let Key = (E.key.length > 1) ? E.key : E.key.toLowerCase();
	if (Key == 'Shift' || Key == 'Tab') return;
	let State = 0 + (E.altKey ? 1 : 0) + (E.ctrlKey ? 2 : 0);
	if (Key == 'Alt' || Key == 'Control') this.Submenu(State);
}
MGUI.prototype.Ear = async function (E) {
	if (!this.Sensing) return;
	E.stopPropagation();
	let Key = (E.key.length > 1) ? E.key : E.key.toLowerCase();
	if (Key == 'Shift' || Key == 'Tab') return;
	else if (this.Workspace.contains(document.activeElement) && Key == 'Enter' || Key == 'Space') return;
	let State = 0 + (E.altKey ? 1 : 0) + (E.ctrlKey ? 2 : 0);
	if (Key == 'Escape' && this.Escape.parentElement == this.Workspace) this.Escape.Function();
	else if (Key == 'Alt' || Key == 'Control') this.Submenu(State);
	else if(this.Chain.length > 0 && Key in this.Chain[this.Chain.length - 1][State]) this.Mouth(this.Chain[this.Chain.length - 1][State][Key]);
}
MGUI.prototype.Sense = function (Setting) {
	if (Setting === undefined) return this.Sensing;
	else if (typeof Setting == 'boolean') {
		this.Sensing = Setting;
		return this.Sensing;
	}else return null;
}
MGUI.prototype.Relocate = function (Workspace) {
	if (!(Workspace instanceof Element)) return false;
	this.Workspace = Workspace;
	return true;
}
MGUI.prototype.Navigate = function (Menu, Reset) {
	if (Menu === false) {
		Menu = this.Chain.pop();
		delete Menu.Parent;
	}
	else if (Menu instanceof MGUI.Menu) {
		if (Reset) this.Chain = [];
		this.Chain.push(Menu);
		Menu.Parent = this;
	}
	else return false;
	return this.Submenu(0);
}
MGUI.prototype.Submenu = function (State, Bind) {
	if (this.Chain.length == 0 || !Number.isInteger(State) || State < 0 || State > 3) return false;
	let Menu = this.Chain[this.Chain.length-1];
	this.State = State;
	this.Workspace.innerHTML='';
	if (!('Escape' in Menu[0]) && this.Chain.length > 1 || (Bind && State > 0)) this.Workspace.appendChild(this.Escape);
	let Hide = [];
	let Recipt = [];
	let Skip = new Set();
	if ((State == 0 || State == 2) && 'Alt' in Menu[State]) {
		Hide.push('Alt');
		Skip.add(1);
		Skip.add(3);
	}
	if ((State == 0 || State == 1) && 'Control' in Menu[State]) {
		Hide.push('Control');
		Skip.add(2);
		Skip.add(3);
	}
	for (let i = 0, l = Hide.length; i < l; i++) {
		this.Workspace.appendChild(Menu[State][Hide[i]]);
		Recipt.push(Hide[i]);
	}
	for (let i = State, l = 4; i < l; i++) if (!Skip.has(i) && MGUI.Filter[State].includes(i)) for(let i2 = 0, o2 = Object.keys(Menu[i]), l2 = o2.length; i2 < l2; i2++) if(!Recipt.includes(o2[i2])) {
		if (Menu[i][o2[i2]] !== null) this.Workspace.appendChild(Menu[i][o2[i2]]);
		for (let i3 = i + 1; i3 < 4; i3++) if(!Skip.has(i3) && o2[i2] in Menu[i3]) this.Workspace.appendChild(Menu[i3][o2[i2]]);
		Recipt.push(o2[i2]);
	}
	if (State == 0)for(let i = 0, l = Menu[4].length; i < l; i++)this.Workspace.appendChild(Menu[4][i]);
	return true;
}
MGUI.Menu = function(NN, NA, CN, CA, XX) {
	this[0] = {};
	this[1] = {};
	this[2] = {};
	this[3] = {};
	this[4] = [];
	if (typeof NN == 'object' && NN !== null) for (Key in NN) this.Adjust(0, Key, NN[Key]);
	if (typeof NA == 'object' && NA !== null) for (Key in NA) this.Adjust(1, Key, NA[Key]);
	if (typeof CN == 'object' && CN !== null) for (Key in CN) this.Adjust(2, Key, CN[Key]);
	if (typeof CA == 'object' && CA !== null) for (Key in CA) this.Adjust(3, Key, CA[Key]);
	if (Array.isArray(XX)) for(let i = 0, l = XX.length; i < l; i++) this.Adjust(4, i, XX[i]);
}
MGUI.Menu.prototype.Adjust = function (State, Key, Options) {
	if(Options === null) {
		delete this[State][Key];
		return;
	}
	let action = document.createElement('div');
	action.setAttribute('class', 'MGUI-Action');
	let header = document.createElement('div');
	if ('Symbol' in Options || 'Name' in Options || 'Function' in Options) {
		action.appendChild(header);
	}
	if ('Symbol' in Options) {
		let symbol = document.createElement('div');
		symbol.setAttribute('class', 'MGUI-Action-Symbol-Box');
		symbol.innerHTML = HTMLS(Options.Symbol);
		header.appendChild(symbol);
	}
	if ('Name' in Options) {
		let name = document.createElement('div');
		name.setAttribute('class', 'MGUI-Action-Name');
		name.innerHTML = HTMLS(Options.Name); // html sanitize?
		header.appendChild(name);
	}
	if (Key == 'Alt' || Key == 'Control') {
		let n = (Key == 'Alt' ? 1 : (Key == 'Control' ? 2 : (Key == 'Shift' ? 4 : 0)));
		action.setAttribute('class', 'MGUI-Action MGUI-Button');
		action.setAttribute('tabindex','0');
		action.setAttribute('onkeyup', 'if(event.key==\'Enter\')this.click()');
		action.addEventListener('click', E => this.Parent.Submenu(State + n, true));
	} else if ('Function' in Options) {
		action.Function = Options.Function;
		action.setAttribute('class', 'MGUI-Action MGUI-Button');
		action.setAttribute('tabindex', '0');
		action.setAttribute('onkeyup', 'if(event.key==\'Enter\')this.click()');
		action.addEventListener('click', () => this.Parent.Mouth(action));
		if (State != 4) {
			let keybinds = document.createElement('div');
			keybinds.setAttribute('class', 'MGUI-Action-Keybinds');
			keybinds.innerHTML = MGUI.Keybinds[State]+`<div class="MGUI-Action-Keybind">${Key}</div></div>`;
			header.appendChild(keybinds);
		}
	}
	if ('Description' in Options) {
		let description = document.createElement('div');
		description.setAttribute('class', 'MGUI-Action-Description');
		description.innerHTML = HTMLS(Options.Description);
		action.appendChild(description);
	}
	this[State][Key] = action;
}
MGUI.Keybinds = [
	'',
	'<div class="MGUI-Action-Keybind">Alt</div>',
	'<div class="MGUI-Action-Keybind">Control</div>',
	'<div class="MGUI-Action-Keybind">Alt</div><div class="MGUI-Action-Keybind">Control</div>',
];
MGUI.Filter = [
	[0, 1, 2, 3],
	[1, 3],
	[2, 3],
	[3]
];
// what does boilerplate do?
//  - take the boilerplate, and the new data, and smoosh them together into a new, instance ready array
MGUI.Boilerplate = function (Boilerplate, Menu, Allow_Overwrite) {
	let Shell = [
		Object.create(null),
		Object.create(null),
		Object.create(null),
		Object.create(null),
		[],
	];
	for (let i = 0; i < 4; i++) Object.keys(Boilerplate[i]).forEach(Key => Shell[i][Key] = Boilerplate[i][Key]);
	for (let i = 0; i < 4; i++) Object.keys(Menu[i]).forEach(Key => {
		if (Allow_Overwrite || !(Key in Shell[i])) Shell[i][Key] = Menu[i][Key]
	});
	Shell[4].push(...Boilerplate[4]);
	Shell[4].push(...Menu[4]);
	return Shell;
}
if (typeof module !== "undefined" && module.exports) module.exports = MGUI;
