var PaintPlayer = {
	recording: null,
	playingObject: null,
	currentRecord: null,
	interval: 5,
	state: 0,
	context: null,

	_requiredRenderCount: 0,
	_renderPending: false,
	_renderCount: 0,

	open: function(key) {
		PaintPlayer.playingObject = JSON.parse(localStorage[key]);
		PaintPlayer.recording = PaintPlayer.playingObject.records.slice();
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
		PaintPlayer.playingObject = null;
		PaintPlayer._renderPending = true;
		PaintPlayer.currentRecord = null;
		PaintPlayer.recording = null;
		console.log("PaintPlayer.play() ended.");
	},
	_playNext: function() {
		window.setTimeout(PaintPlayer._internalPlay, PaintPlayer.interval);
	},
	_internalPlay: function() {

		if(PaintPlayer._requiredRenderCount > PaintPlayer.renderCount) {
			PaintPlayer._playNext();
			console.log("Waiting for a render");
			return;
		}

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

			if(cur.position <= player.position) {
				var needRender = false;
				switch(cur.type) {

					case 'lineTo':
						PaintPlayer.context.lineTo(cur.x, cur.y);
						break;
					case "moveTo":
					case "strokeStyle":
					case "lineWidth":
						needRender = true;
						cur.type += "AfterRender";
						break;
					case 'moveToAfterRender':
						PaintPlayer.context.beginPath();
						PaintPlayer.context.moveTo(cur.x, cur.y);
						break;
					case "strokeStyleAfterRender":
						PaintPlayer.context.strokeStyle = cur.x;
						PaintPlayer.context.beginPath();
						break;
					case "lineWidthAfterRender":
						PaintPlayer.context.lineWidth = cur.x;
						PaintPlayer.context.beginPath();
						break;
				}

				if(needRender) {
					PaintPlayer._renderPending = true;
					PaintPlayer._requiredRenderCount = PaintPlayer.renderCount + 1;
				} else {
					PaintPlayer.currentRecord = null;
					didPlay = true;
				}
			}

		} while(didPlay);

		// PaintPlayer._renderPending = true;
		PaintPlayer._playNext();
	}
};