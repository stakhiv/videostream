+function () {
	var body = document.getElementsByTagName('body')[0];
	var screenCanvas = document.getElementById('screen_canvas');
        var WIDHT = screenCanvas.width;
        var HEIGHT = screenCanvas.height;
	var screenCanvasContext = screenCanvas.getContext('2d');
    var framebuffer;
	var video;


	var socket = new WebSocket("ws://localhost:8080");

	socket.onmessage = function(event) {
	  	var reader = new FileReader();
	  	reader.readAsArrayBuffer(event.data);

	  	reader.onloadend = function() {
		    var view = new Uint8ClampedArray(this.result);
			var imageData = screenCanvasContext.getImageData(0,0, WIDHT, HEIGHT);
			var data = imageData.data;
			var length = data.length;
			
			while(--length >=0) {
				data[length] = view[length];
			}

                  	screenCanvasContext.putImageData(imageData, 0, 0);
	  	};
	}
   
    function createVideo(src, type) {
    	var video = document.createElement('video');
    	video.controls = true;
	    var source = document.createElement('source');
	    video.appendChild(source);
	    video.id = 'video';
	    source.src = src;
	    source.type = type;
	    return video;
    }

	function handleFileSelect(e) {
	    var file = e.target.files[0];
	    if (!file) return;
	    var dataUrl = window.URL.createObjectURL(file);
	    video = createVideo(dataUrl, file.type);
	    body.appendChild(video);
	    
	    video.addEventListener('canplay', function () {
	    	framebuffer = new Framebuffer(video.videoWidth, video.videoHeight);
	    	video.addEventListener('play', draw);
	    	video.play();
	    });
		
    }
    	
	function draw() {
		if(video.paused || video.ended){
			return false;
		}
		framebuffer.context.drawImage(video, 0, 0, framebuffer.width, framebuffer.height);
		var frame_data = framebuffer.context.getImageData(0, 0, framebuffer.width, framebuffer.height).data;
	  	socket.send(frame_data.buffer);
		setTimeout(draw, 1000/30);
	}

	function Framebuffer(width, height) {
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.width = width/4;
	    this.canvas.height = this.height = height/4;
	    this.context = this.canvas.getContext("2d");
	    return this;
	}

	document.getElementById('video_file').addEventListener('change', handleFileSelect, false);
}();
