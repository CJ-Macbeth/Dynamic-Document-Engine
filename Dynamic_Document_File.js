const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const jsdom = require('jsdom');

const Dynamic_Document_File = function (Path) {
	this.Path = Path;
}
Dynamic_Document_File.prototype.Meta = async function () {
	let Shell = Object.create(null);
	Shell.Path = this.Path;
	Shell.Uncontrolled_Revisions = [];
	Shell.Controlled_Revisions = [];
	Shell.Current_Revision = null;
	Shell.Figure_Path = path.join(this.Path, 'Figures', 'FIGURE');
	Shell.Uncontrolled_Figure_Path = path.join(this.Path, 'Uncontrolled_Figures', 'FIGURE');
	Shell.Warnings = [];
	let files = await fsp.readdir(this.Path);
	for (let i = 0, l = files.length; i < l; i++) {
		if (this.Hidden.includes(files[i])) continue;
		else if (files[i].match(/UNCONTROLLED.\d+.html/)) Shell.Uncontrolled_Revisions.push(files[i]);
		else if (files[i].match(/\d{4}.\d{2}.\d{2}.\d+.html/)) Shell.Controlled_Revisions.push(files[i]);
		else if (files[i] == 'CONTROLLED') Shell.Current_Revision = await fsp.readlink(path.join(this.Path, 'CONTROLLED')).then(path.basename);
		else if (files[i] == 'Figures')  Shell.Figures = await fsp.readdir(path.join(this.Path, files[i]));
		else if (files[i] == 'Uncontrolled_Figures') Shell.Uncontrolled_Figures = await fsp.readdir(path.join(this.Path, files[i]));
		else Shell.Warnings.push(`Document directory contains unrecognized entry: ${files[i]}`);
	}
	return Shell;
}
Dynamic_Document_File.prototype.New = async function (Revision) {
	let Meta = await this.Meta();
	let Highest_Uncontrolled_Revision = Meta.Uncontrolled_Revisions.reduce((Highest_Revision, This_Revision) => {
		let Revision_Number = Number(This_Revision.match(/\d+/)[0]);
		return Revision_Number > Highest_Revision ? Revision_Number : Highest_Revision;
	}, 0);
	let Destination = `UNCONTROLLED.${Highest_Uncontrolled_Revision + 1}.html`;
	let Elements = '';
	if (Revision) {
		let Document = await fsp.readFile(path.join(this.Path, Revision));
		let DOM = new JSDOM(Document);
		let Container = DOM.getElementById('Container');
		for (let i = 0, l = Container.children.length; i < l; i++) Elements += Container.children[i].outerHTML;
	}
	let HTML = await Dynamic_Document_File.Template(Elements.length > 0 ? Elements : null, false);
	await fsp.writeFile(path.join(this.Path, Destination), HTML);
	return Destination;
}
Dynamic_Document_File.prototype.Save = async function (Revision, Contents) {
	//let External_Images = Object.create(null);
	//for (let i = 0, l = Contents.length; i < l; i++) if (
	//		Contents[i].Type == 'Image'
	//		&& Contents[i].Image.substring(0, 9) != '/Figures'
	//		&& Contents[i].Image.substring(0, 22) != '/Uncontrolled_Figures/'
	//		&& !Moved_Images.includes(Contents[i].Image)
	//) External_Images.push[Contents[i].Image] = Contents[i];
	//let New_Paths = await this.Save_Images(Object.keys(External_Images));
	//for (let i = 0, l = External_Images.length; i < l; i++) External_Images[i].Path = New_Paths[i];
	//let HTML = '';
	//for (let i = 0, l = Contents.length; i < l; i++) HTML += Dynamic_Document_Edit.Draw(Contents[i]);
	let File = await Dynamic_Document_File.Template(Contents);
	await fsp.writeFile(path.join(this.Path, Revision), File);
	return Revision;
}
Dynamic_Document_File.prototype.Save_Images = async function (Elements) {
	let Meta = await this.Meta();
	let Highest_Figure = Meta.Uncontrolled_Figures.reduce((Highest_Figure, This_Figure) => {
		let Figure_Number = Number(This_Figure.match(/\d+/)[0]);
		return Figure_Number > Highest_Figure ? Figure_Number : Highest_Figure;
	}, 0);
	let Move = async (Element) => {
		if (Element.Type != 'Image') return;
		let Directory = path.dirname(Element.Image);
		if (
			path.relative(path.join(this.Path, 'Uncontrolled_Figures'), Directory) == ''
			&& path.relative(path.join(this.Path, 'Figures'), Directory) == ''
		)  return;
		let Figure = `UNCONTROLLED_FIGURE.${++Highest_Figure}${path.extname(Element.Image)}`;
		await fsp.copyFile(Element.Image, path.join(this.Path, 'Uncontrolled_Figures', Figure)).then(() => Element.Image = Figure);
	}
	if (Array.isArray(Elements)) for (let i = 0, l = Elements.length; i < l; i++) await Move(Elements[i]);
	else await Move(Elements);
	return Elements;
}
Dynamic_Document_File.prototype.Publish = async function (Revision) {
	let Meta = await this.Meta();
	let Parent_File = await fsp.readFile(path.join(this.Path, Revision));
	let JSDOM = new jsdom.JSDOM(Parent_File);
	let Document = JSDOM.window.document;
	let Container = Document.getElementById('Container');
	let Moved_Images = [];
	let HTML = '';
	let Highest_Figure = Meta.Figures.reduce((Highest_Figure, This_Figure) => {
		let Figure_Number = Number(This_Figure.match(/\d+/)[0]);
		return Figure_Number > Highest_Figure ? Figure_Number : Highest_Figure;
	}, 0);
	for (let i = 0, l = Container.children.length; i < l; i++) {
		let Child = Container.children[i];
		if (
			Child.getAttribute('data-type') == 'Image'
			&& (Child.src.substring(0, 9) != '/Figures/' && !Moved_Images.includes(Child.src))
		) {
			let Figure = `FIGURE-${++Highest_Figure}${path.extname(Container.children[i].src)}`;
			if (Child.substring(0, 22) == '/Uncontrolled_Figures/') await fsp.copyFile(path.join(this.Path, 'Uncontrolled_Figures', Child.src), path.join(this.Path, 'Figures', Figure));
			else await fsp.copyFile(Child.src, path.join(this.Path, 'Figures', Figure)); // rewrite to get file:/// location !!
			Moved.push(Child.src);
			Child.src = `/Uncontrolled_Figures/${Figure}`;
		}
		HTML += Child.outerHTML;
	}
	let File = await Dynamic_Document_File.Template('<div id="Container">' + HTML + '</div>', true);
	let Now = new Date();
	let Subrevision = 1;
	let Publish_Date = Now.getFullYear() + '.' + ('0' + (Now.getMonth() + 1)).slice(-2) + '.' + ('0' + Now.getDate()).slice(-2);
	while (fs.existsSync(path.join(this.Path, Publish_Date + '.' + Subrevision + '.html'))) Subrevision++;
	let Published = Publish_Date + '.' + Subrevision + '.html';
	await fsp.writeFile(path.join(this.Path, Published), File);
	if (fs.existsSync(path.join(this.Path, 'CONTROLLED'))) await fsp.unlink(path.join(this.Path, 'CONTROLLED'));
	await fsp.symlink(path.join(this.Path, Published), path.join(this.Path, 'CONTROLLED'));
	return Published;
}
Dynamic_Document_File.prototype.Delete = async function (Revision) {
	let Meta = await this.Meta();
	if (Meta.Uncontrolled_Revisions.includes(Revision)) return await fsp.unlink(path.join(this.Path, Revision)).then(R => {return true});
	else return false;
}
Dynamic_Document_File.prototype.Hidden = ['VERSION', 'Dynamic_Document_View.js', 'Dynamic_Document_Edit.js', 'HTMLS.js', 'index.css'];
Dynamic_Document_File.New = async function (Path) {
	// check/err
	await fsp.mkdir(Path);
	// add copying of version
	await fsp.copyFile(path.join(__dirname, 'VERSION'), path.join(Path, 'VERSION'));
	await fsp.copyFile(path.join(__dirname, 'index.css'), path.join(Path, 'index.css'));
	await fsp.copyFile(path.join(__dirname, 'Dynamic_Document_View.js'), path.join(Path, 'Dynamic_Document_View.js'));
	await fsp.copyFile(path.join(__dirname, 'Dynamic_Document_Edit.js'), path.join(Path, 'Dynamic_Document_Edit.js'));
	await fsp.copyFile(path.join(__dirname, 'HTMLS.js'), path.join(Path, 'HTMLS.js'));
	await fsp.mkdir(path.join(Path, 'Figures'));
	await fsp.mkdir(path.join(Path, 'Uncontrolled_Figures'));
	let File = await Dynamic_Document_File.Template();
	await fsp.writeFile(path.join(Path, 'UNCONTROLLED.1.html'), File);
	return Path;
}
Dynamic_Document_File.Template = async function (Content, Published) {
	let Template = await fsp.readFile(path.join(__dirname, 'Template.html')).then(File => new jsdom.JSDOM(File));
	let Document = Template.window.document;
	if (!Published) {
		let Edit_Script = Document.createElement('script');
		Edit_Script.setAttribute('src', 'Dynamic_Document_Edit.js');
		Document.head.appendChild(Edit_Script);
		let Init_Script = Document.createElement('script');
		Init_Script.innerHTML = `var Viewer, Editor; function init() {
			Alert = window.self !== window.top ? () => window.top.postMessage('Navigation', '*') : null;
			Viewer = new Dynamic_Document_Viewer(document.getElementById('Container'), false, Alert);
			Editor = new Dynamic_Document_Editor(Viewer);
			window.addEventListener('message', Message => {
				try {
					Message.ports[0].postMessage({status: true, result: Editor.API(Message.data.Command, Message.data.Options)});
				} catch (E) {
					Message.ports[0].postMessage({status: false, result: E});
				}
		})}`;
		Document.head.appendChild(Init_Script);
	} else {
		let Init_Script = Document.createElement('script');
		Init_Script.innerHTML = `var Viewer; function init() {
			Alert = window.self !== window.top ? () => window.top.postMessage('Navigation', '*') : null;
			Viewer = new Dynamic_Document_Viewer(document.getElementById('Container'), false, Alert);
			window.addEventListener('message', Message => {
				try {
					Message.ports[0].postMessage({status: true, result: Viewer.API(Message.data.Command, Message.data.Options)});
				} catch (E) {
					Message.ports[0].postMessage({status: false, result: E});
				}
		})}`;
		Document.head.appendChild(Init_Script);
	}
	if (Array.isArray(Content)) Document.body.append(...Content);
	else if (typeof Content == 'string' && Content.length > 0) Document.body.innerHTML = Content;
	else Document.body.innerHTML = '<div id="Container"><div class="Meta Element"><h1>UNTITLED</h1></div></div>'; // replace with actual creation using Edit.js
	return Template.serialize();
}
module.exports = Dynamic_Document_File;

/*

-- error handling wave
-- how will malformed document dirs be reported and repaired?
-- check and repair to the current version of all documents (hidden documents)
-- check for version compatibility

////////// CHAOS BELOW

Dynamic_Document_File.prototype.New = async function (Revision) {
	// check/err
	let Meta = await this.Meta();
	let Highest_Uncontrolled_Revision = Meta.Uncontrolled_Revisions.reduce((Highest_Revision, This_Revision) => {
		let Revision_Number = Number(This_Revision.match(/\d+/)[0]);
		return Revision_Number > Highest_Revision ? Revision_Number : Highest_Revision;
	}, 0);
	let Destination = path.join(this.Path, `UNCONTROLLED.${Highest_Uncontrolled_Revision + 1}.html`);
	if (Meta.Uncontrolled_Revisions.includes(Revision)) await fsp.copyFile(path.join(this.Path, Revision), Destination);
	else if (Meta.Controlled_Revisions.includes(Revision)) {} // turn controlled into uncontrolled and write file
	else await fsp.writeFile(Destination, Dynamic_Document_File.Uncontrolled());
	//let Source = Revision ? path.join(this.Path, Revision) : path.join(__dirname, 'index.html');
	//await fsp.copyFile(Source, Destination);
	return Destination;
}
Dynamic_Document_File.prototype.Save = async function (Revision, Elements) {
	for (let i = 0, l = Elements.length; i < l; i++) ; // move in and rename the images as necessary
	let HTML = this.Uncontrolled(Elements.reduce((Document, Element) => Document + Dynamic_Document_Editor.Draw(Element),''));
	await fsp.writeFile(path.join(this.Path, Revision), this.Uncontrolled(HTML));
	return Revision;
}
Dynamic_Document_File.prototype.Publish = async function (Revision, Elements) {
	// check/err
	let Meta = await this.Meta();
	let File = await fsp.readFile(path.join(this.Path, Revision), 'utf8');
	let Document = new JSDOM(File);
	let Container = Document.getElementById('Container');
	let Moved = [];
	for (let i = 0, l = Container.children.length; i < l; i++) {
		if (Container.children[i].getAttribute('data-type') != 'Image') continue;
		else if (Moved.includes(Container.children[i].source)) continue;
		else if (Container.children[i].source.substring(0,9) == '/Figures/') continue;
		else {
			// !! fix image src, to pull references to local files (file:///home/user/Pictures/newfigure.png)

			let Next_Figure = Meta.Uncontrolled_Revisions.reduce((Highest_Figure, This_Figure) => {
				let Figure_Number = Number(This_Figure.match(/\d+/)[0]);
				return Figure_Number > Highest_Figure ? Figure_Number : Highest_Figure;
			}, 0);
			let Figure = `FIGURE-${Next_Figure}${path.extname(Container.children[i].source)}`;
			// make sure the source is saved properly as a file path (may need to clip the leading  file://)
			await fsp.copyFile(Container.children[i].src, path.join(this.Path, 'Figures', Figure));
			Moved.push(Container.children[i].src);
			Container.children[i].src = `/Figures/${Figure}`;
		}
	}
	let HTML = Dynamic_Document_File.Uncontrolled(Container.outerHTML);
	let Now = new Date();
	let Subrevision = 1;
	let Publish_Date = Now.fullYear() + ('0' + (Now.getMonth() + 1)).slice(-2) + '.' + ('0' + Now.getDate()).slice(-2);
	while (fs.existsSync(path.join(this.Path, Publish_Date + '.' + Subrevision + '.html'))) Subrevision++;
	let Published = Publish_Date + '.' + Subrevision + '.html';
	await fsp.writeFile(path.join(this.Path, Published), HTML);
	if (fs.existsSync(path.join(this.Path, 'CONTROLLED'))) await fsp.unlink(path.join(this.Path, 'Controlled'));
	await fsp.symlink(path.join(this.Path, 'CONTROLLED'), path.join(this.Path, Published));
	return Published;
}

how will working between revisions and images work?:
 save - save over the current uncontrolled revision
 publish - turn specified uncontrolled revision into the newest controlled revision
 new - create a new uncontrolled revision from the given revision, or create a new blank one

Save () -> overwrite the document with the new data, move in the new images
Publish () -> transform header into controlled header, copy to controlled list, move in all images, delete the old revision
New () -> create a new uncontrolled, copy over existing content as requested

new Document()
Meta
New
Save
Publish
Delete
*/
