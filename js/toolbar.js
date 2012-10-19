$(function(){

	var context = $('#paper')[0].getContext('2d');


	$('.chzn-select').chosen();

	$('body').click(function(e){
		$('.brush-size > ul:visible').fadeOut(100);
	});

	/*
	 * Menu
	 */
	$('.menu .new').click(function(e){
		Paint.startNew();
	});
	$('.menu .save').click(function(e){
		console.log("Saving...");
		$('#save-modal').modal();
		console.log("done.");
	});
	$('#save').click(function(e) {
		var name = $('#save-modal input').val();

		if(name.length > 0) {
			localStorage['recording.' + name] = JSON.stringify({
				trackUri: Paint.trackUri,
				records: Paint.recording
			});
			$('#save-modal').modal('hide');
		}
	});
	$('.menu .open').click(function(e){

		// Load options into select-element
		var select = $('#open-modal select');
		select.html('');
		for(var key in localStorage) {
			if(key.length > 10 && key.substring(0, 10) === "recording.")
			{
				var name = key.substring(10);
				select.append($('<option/>',{
					value: key,
					text: name
				}));
			}
		}
		select.trigger("liszt:updated");

		// Open modal
		$('#open-modal').modal();
	});
	$('#open').click(function(e){
		console.log("Loading...");
		Paint.reset();
		PaintPlayer.context = $('#paper-playback')[0].getContext('2d');
		PaintPlayer.open($('#open-modal select').val());
		console.log("Loaded.");
		PaintPlayer.play();
		$('#open-modal').modal('hide');

	});

	/*
	 * Brush Size
	 */
	$('.brush-size button').click(function(e){
		var input = $('.brush-size input');
		var ul = $('.brush-size > ul');
		var pos = input.offset();
		pos.top += input.height() + 10;

		ul.fadeIn(100);
		ul.offset(pos);
		
		return false;
	});

	$('.brush-size > ul > li').click(function(e){
		var input = $('.brush-size input');
		input.val($(this).text());
		input.trigger('change');
		$(this).parent().fadeOut(100);
	});

	$('.brush-size input').change(function(e){
		var num = parseInt(e.target.value, 10);
		console.log("Brush size: " + num);
		if(!isNaN(num)) {
			context.lineWidth = num;
			Paint.recording.push(new PaintRecord("lineWidth", context.lineWidth));
		}
	});

	/*
	 * Color picker
	 */
	$('#color-picker').colorpicker().on('changeColor', function(e){
		console.log("Foreground color: ", e.color);
		context.strokeStyle = $('#color-picker').data('colorpicker').format();
		Paint.recording.push(new PaintRecord("strokeStyle", context.strokeStyle));
	});
});
