var PaintPlayer = {
	recording: null,
	playingObject: null,
	currentRecord: null,
	interval: 5,
	state: 0,
	contexts: {},
	contextRenderInfo: {},

	//_requiredRenderCount: 0,
	//_pendingRenders: {},
	//_renderCounts: {},

	open: function(key) {
		// PaintPlayer.playingObject = JSON.parse(localStorage[key]);
		PaintPlayer.playingObject = PaintRecording.load(key);
		PaintPlayer.recording = PaintPlayer.playingObject.records.slice();
		Paint.trackUri = PaintPlayer.playingObject.trackUri;
		Paint.currentLayer = PaintPlayer.playingObject.layers.length;
		PaintState.isNew = false;
		PaintState.currentRecording = PaintPlayer.playingObject;

		// Create playback canvases
		var playback = $('#playback');
		var initObject = { width: playback.width(), height: playback.height() };
		for(var k in PaintPlayer.playingObject.layers) {
			var canvas = $('<canvas />', initObject)[0];
			canvas.width = initObject.width;
			canvas.height = initObject.height;
			PaintPlayer.contexts[k] = canvas.getContext('2d');
			PaintPlayer.contextRenderInfo[k] = {
				count: 0,
				pending: false,
				required: 0
			};
			playback.append(canvas);
		}

		// Setup contexts
		for(k in PaintPlayer.contexts)
			Paint.setupContext(PaintPlayer.contexts[k]);
	},

	play: function() {
		if(PaintPlayer.state) PaintPlayer.stop();

		PaintPlayer.state = 1;
		PaintPlayer._playNext();

		// Start player
		player.play(PaintPlayer.playingObject.trackUri);
		player.position = 0;

		console.log("PaintPlayer.play() started.");
	},

	stop: function() {
		PaintPlayer.state = 0;
		// PaintPlayer.playingObject = null;
		// PaintPlayer._renderPending = true;
		// PaintPlayer.contexts = {};
		// PaintPlayer.contextRenderInfo = {};
		PaintPlayer.currentRecord = null;
		PaintPlayer.recording = null;
		console.log("PaintPlayer.play() ended.");
	},

	_playNext: function() {
		window.setTimeout(PaintPlayer._internalPlay, PaintPlayer.interval);
	},

	_internalPlay: function() {

		var didPlay;

		do
		{
			didPlay = false;

			if(PaintPlayer.currentRecord === null) {
				PaintPlayer.currentRecord = PaintPlayer.recording.shift();

				if(typeof(PaintPlayer.currentRecord) === 'undefined') {
					PaintPlayer.stop();
					return;
				}
			}

			var cur = PaintPlayer.currentRecord;
			var info = PaintPlayer.contextRenderInfo[cur.layer];

			if(info.required > info.count) {
				PaintPlayer._playNext();
				return;
			}

			if(cur.position <= player.position) {

				// We are going to want this context to be redrawn.
				info.pending = true;

				var needRender = false;
				var context = PaintPlayer.contexts[cur.layer];

				switch(cur.type) {

					case 'lineTo':
						context.lineTo(cur.x, cur.y);
						break;
					case "moveTo":
					case "strokeStyle":
					case "lineWidth":
						needRender = true;
						cur.type += "AfterRender";
						break;
					case 'moveToAfterRender':
						context.beginPath();
						context.moveTo(cur.x, cur.y);
						break;
					case "strokeStyleAfterRender":
						context.strokeStyle = cur.x;
						context.beginPath();
						break;
					case "lineWidthAfterRender":
						context.lineWidth = cur.x;
						context.beginPath();
						break;
				}

				if(needRender) {
					//PaintPlayer._renderPending = true;
					//PaintPlayer._requiredRenderCount = PaintPlayer.renderCount + 1;
					info.required = info.count + 1;
				} else {
					PaintPlayer.currentRecord = null;
					didPlay = true;
				}
			}

		} while(didPlay);

		PaintPlayer._playNext();
	}
};