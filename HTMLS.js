function HTMLS(S){
	return S.toString().replace(/[<>"'\r\n&]/g,k=>{return `&${HTMLS.Table[k]};`});
}
HTMLS.Table={
	'<':'lt',
	'>':'gt',
	'"':'quot',
	'\'':'apos',
	'&':'amp',
	'\r':'#10',
	'\n':'#13'
};
if(typeof module!=="undefined"&&module.exports)module.exports=HTMLS;