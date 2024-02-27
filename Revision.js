function Revision(Text){
	let Numbers=Text.match(Revision.Pattern);
	let Major=0;
	let Minor=0;
	let Patch=0;
	if(Number.isInteger(Number(Numbers[1])))Major=Number(Numbers[1]);
	if(Number.isInteger(Number(Numbers[2])))Minor=Number(Numbers[2]);
	if(Number.isInteger(Number(Numbers[3])))Patch=Number(Numbers[3]);
	return new Revision.Shell(Major,Minor,Patch);
}
Revision.Pattern=/([\d]*).([\d]*).([\d]*)/;
Revision.isCompatible=function(R1,R2){
	// R1=Module, R2=File
	if(R1.Major!=R2.Major)return false;
	if(R1.Minor<R2.Minor)return false;
	return true;
}
Revision.Shell=function(Major,Minor,Patch){
	this.Major=Major;
	this.Minor=Minor;
	this.Patch=Patch;
}
Revision.Shell.prototype.toString=function(){
	return `${this.Major}.${this.Minor}.${this.Patch}`;
}
Revision.Shell.prototype.toArray=function(){
	return [this.Major,this.Minor,this.Patch];
}
Revision.Shell.prototype.Clone=function(){
	return new Revision(this.toString());
}
if(typeof module!=="undefined"&&module.exports)module.exports=Revision;