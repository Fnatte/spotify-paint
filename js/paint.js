// Get spotify API
var sp = getSpotifyApi();
var models = sp.require("sp://import/scripts/api/models");
var player = models.player;

var ignoreObserveChange = false;

var Paint = {
	defaultColor: 'rgba(200,150,130,1)',
	defaultBrushSize: 32,

	currentLayer: 0,
	renderPending: false,
	renderCount: 0,
	recording: [],
	trackUri: '',

	context: null,

	reset: function() {
		var canvas = $('#paper')[0];
		// var canvasPlayback = $('#paper-playback')[0];
		Paint.context = canvas.getContext('2d');
		// var contextPlayback = canvasPlayback.getContext('2d');

		Paint.context.clearRect(0, 0, canvas.width, canvas.height);
		Paint.setupContext(Paint.context);
		

		// canvasPlayback.width = canvas.width;
		// contextPlayback.strokeStyle = Paint.defaultColor;
		// contextPlayback.lineWidth = Paint.defaultBrushSize;
		// contextPlayback.lineCap = 'round';
		// contextPlayback.lineJoin = 'round';

		// Remove all playback canvases
		$('#playback').empty();

		Paint.currentLayer = 0;

		// Clear the current recordings
		Paint.recording.length = 0;
		PaintPlayer.state = 0;
		PaintPlayer.recording = null;
		PaintPlayer.currentRecord = null;

		// Clear the state
		PaintState.reset();
	},

	setupContext: function(context) {
		context.strokeStyle = Paint.defaultColor;
		context.lineWidth = Paint.defaultBrushSize;
		context.lineCap = 'round';
		context.lineJoin = 'round';
	},

	startNew: function() {
		Paint.reset();
		player.position = 0;
		player.playing = true;
		PaintState.isNew = true;

		Paint.trackUri = player.track.uri;
		Paint.recording.push(new PaintRecord("lineWidth", Paint.context.lineWidth));
		Paint.recording.push(new PaintRecord("strokeStyle", Paint.context.strokeStyle));
	},

	toCurrentRecording: function() {
		if(PaintState.isNew) {
			var rec = new PaintRecording();
			rec.records = Paint.recording;
			rec.layers = [ 0 ];
			rec.trackUri = Paint.trackUri;
			PaintState.currentRecording = rec;
		} else if(PaintState.currentRecording !== null) {

			var a = PaintState.currentRecording.records;
			var b = Paint.recording;

			if(a.length === 0) return b;
			if(b.length === 0) return a;

			// Merge the recordings (merge-sort)
			var c = new Array(a.length + b.length),
				i = 0,
				j = 0,
				k = 0;

			while(i < a.length || j < b.length) {
				if(i < a.length && j < b.length) {
					if(a[i].position <= b[j].position) {
						c[k] = a[i];
						i++;
					} else {
						c[k] = b[j];
						j++;
					}
				} else if(i < a.length) {
					c[k] = a[i];
					i++;
				} else {
					c[k] = b[j];
					j++;
				}
				k++;
			}

			PaintState.currentRecording.records = c;
			PaintState.currentRecording.layers.push(Paint.currentLayer);
		}
	}
};

var PaintRecord = function(type, x, y) {
	this.type = type;
	this.x = x;
	this.y = y;
	this.position = player.position;
	this.layer = Paint.currentLayer;
};

$(function(){
	console.log("Ready");

	var canvas = $('#paper');
	canvas[0].width = canvas.width();
	canvas[0].height = canvas.height();

	// var canvasPlayback = $('#paper-playback');
	// canvasPlayback[0].width = canvas[0].width;
	// canvasPlayback[0].height = canvas[0].height;

	var context = canvas[0].getContext("2d");
	// var contextPlayback = canvasPlayback[0].getContext("2d");

	Paint.startNew();

	var painting = false;

	var lastX, lastY;
	var step = 3;

	canvas.mousedown(function(e){
		if(e.button === 0) {
			var x = e.pageX - this.offsetLeft;
			var y = e.pageY - this.offsetTop;
			painting = true;
			context.beginPath();
			context.moveTo(x, y);
			lastX = x;
			lastY = y;

			Paint.recording.push(new PaintRecord("moveTo", x, y));
		}
	});

	canvas.mousemove(function(e){

		if(e.which !== 1) {
			painting = false;
			return;
		}

		// Draw line if painting
		if(painting) {

			var x = e.pageX - this.offsetLeft;
			var y = e.pageY - this.offsetTop;

			// Calculate distance between (x,y) and (lastX, lastY).
			var d = Math.sqrt( Math.pow(lastX - x, 2) + Math.pow(lastY - y, 2) );
			if(d >= step)
			{
				context.lineTo(x, y);
				lastX = x;
				lastY = y;
				Paint.renderPending = true;
				Paint.recording.push(new PaintRecord("lineTo", x, y));
			}
		}
	});

	canvas.mouseup(function(e){
		painting = false;
	});

	var render = function(dt) {
		if(Paint.renderPending) {
			context.stroke();
			Paint.renderPending = false;
			Paint.renderCount++;
		}

		if(PaintPlayer.state && PaintPlayer.playingObject !== null) {
			for(var i = 0, len = PaintPlayer.playingObject.layers.length; i < len; i++) {
				var layer = PaintPlayer.playingObject.layers[i];
				var info = PaintPlayer.contextRenderInfo[layer];
				if(info.pending) {
					PaintPlayer.contexts[layer].stroke();
					info.pending = false;
					info.count++;
				}
			}
		}

		//if(PaintPlayer._renderPending) {
		//	PaintPlayer.context.stroke();
		//	PaintPlayer._renderPending = false;
		//	PaintPlayer._renderCount++;
		//}


		window.webkitRequestAnimationFrame(render);
	};
	window.webkitRequestAnimationFrame(render);

});

player.observe(models.EVENT.CHANGE, function(e) {
	if(ignoreObserveChange) {
		return;
	}

	if(e.data.curtrack && Paint.trackUri != player.track.uri) {

		if(PaintPlayer.state) {
			if(player.position > 0) {
				PaintPlayer.stop();
			}
		} else {
			console.log("From", Paint.trackUri);
			console.log("To", player.track.uri);
			$('#track-changed-modal').modal();
		}

		
	}
});