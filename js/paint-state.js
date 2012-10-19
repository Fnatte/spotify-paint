var PaintState = {
	currentRecording: null,
	isNew: true,

	reset: function() {
		PaintState.currentRecording = null;
		PaintState.isNew = true;
	}
};