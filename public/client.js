+function () {
  var body = document.getElementsByTagName('body')[0];
  var screenCanvas = document.getElementById('screen_canvas');
  var WIDHT = screenCanvas.width;
  var HEIGHT = screenCanvas.height;
  var screenCanvasContext = screenCanvas.getContext('2d');
  var framebuffer;
  var video;
  var responseBuffer;


  var socket = new WebSocket("ws://"+window.location.host);

  socket.onmessage = function(event) {
    var reader = new FileReader();
    reader.readAsArrayBuffer(event.data);

    reader.onloadend = function() {
      var view = new Uint16Array(this.result);
      var imageData = screenCanvasContext.getImageData(0,0, WIDHT, HEIGHT);
      var data = imageData.data;
      var length = view.length/2;
      var s;
      var combined, r, g, b;
      // var r = g = b = 0;

      // for (var i = 0; i< length; i+=4) {
      //     // data[i] = view[i];
      //     // data[i+1] = view[i+1];
      //     // data[i+2] = view[i+2];
      //     r += view[i];
      //     g += view[i+1];
      //     b += view[i+2];
      // }
      // var l = length/4;
      // r = r/l;
      // g = g/l;
      // b = b/l;
      // body.style.backgroundColor = 'rgb('+r+','+g+','+b+')';
      for (var i = 0; i < length; i++) {
        s = i*2;
        combined = view[s+1];
        b = combined % 256;
        combined = Math.floor(combined / 256);
        g = combined % 256;
        r = Math.floor(combined / 256);
        data[view[s]] = r;
        data[view[s]+1] = g;
        data[view[s]+2] = b;
        data[view[s]+3] = 255;
      }

      //  while(--length >=0) {
      //    data[length] = view[length];
      //  }

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
      responseBuffer = new Uint16Array(framebuffer.width*framebuffer.height*2);
      video.addEventListener('play', draw);
      video.play();
    });
  }
  
  var lastFrame;
  function draw() {
    if(video.paused || video.ended){
      return false;
    }
    framebuffer.context.drawImage(video, 0, 0, framebuffer.width, framebuffer.height);

    var frame_data = framebuffer.context.getImageData(0, 0, framebuffer.width, framebuffer.height).data;
    var k, ri, gi, bi, r, g, b;
    var count = 0;
    if (lastFrame!==undefined) {
        for (var i = 0, l = frame_data.length/4; i<l;i++) {
          ri = i*4;
          gi = ri + 1;
          bi = ri + 2;
          k = (frame_data[ri] + frame_data[gi] + frame_data[bi]) / 3
          kprev = (lastFrame[ri] + lastFrame[gi] + lastFrame[bi]) / 3
          if (Math.abs(k - kprev) > 20) {
              r = frame_data[ri];
              g = frame_data[gi];
              b = frame_data[bi];
              responseBuffer[count++] = ri;
              responseBuffer[count++] = (Math.floor(r)*256+Math.floor(g))*256+Math.floor(b);
          }

          //if (frame_data[gi] !== lastFrame[gi]) {
          //    frame_data[gi] *= 1.5;
          //}
          //if (frame_data[bi] !== lastFrame[bi]) {
          //    frame_data[bi] *= 1.5;
          //}
          //k = (frame_data[z] + frame_data[z] + frame_data[z]) / 3;
          //frame_data[z] = frame_data[z+1] = frame_data[z+2] = k;
        }
    }
    lastFrame = frame_data;
    if (count) {
        socket.send(responseBuffer.subarray(0, count));
    }
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
