var PaintRecording = function() {
	this.name = '';
	this.records = [];
	this.layers = [];
	this.trackUri = '';

	this.save = function() {
		localStorage['recording.' + this.name] = JSON.stringify(this);
		console.log("Saved \"" + this.name + "\"");
	};
};

PaintRecording.load = function(key) {
	var obj = JSON.parse(localStorage[key]);
	var rtn = new PaintRecording();

	for(var k in rtn) {
		if(typeof(obj[k]) !== 'undefined') {
			rtn[k] = obj[k];
		}
	}

	return rtn;
};