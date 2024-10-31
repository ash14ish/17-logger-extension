// Screenshot 
chrome.windows.getCurrent({}, w => {
    chrome.windows.update(w.id, { focused: true }, () => {
      const sources = ["screen", "window", "tab"];
        chrome.tabs.getCurrent((tab) => {
          chrome.desktopCapture.chooseDesktopMedia(sources, tab, (streamId) => {
            let track, canvas;
            navigator.mediaDevices.getUserMedia({
              video: {
                mandatory: {
                  chromeMediaSource: "desktop",
                  chromeMediaSourceId: streamId
                },
              }
            }).then((stream) => {
              track = stream.getVideoTracks()[0];
              const imageCapture = new ImageCapture(track);
              return imageCapture.grabFrame();
            }).then((bitmap) => {
              track.stop();
              canvas = document.createElement("canvas");
              canvas.width = bitmap.width;
              canvas.height = bitmap.height;
              let context = canvas.getContext("2d");
              context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
              return canvas.toDataURL();
            }).then((url) => {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              chrome.downloads.download({
                filename: `Screenshot-${timestamp}.png`,
                url: url,
              }, () => {
                canvas.remove();
              });
            }).catch((err) => {
              console.log(err);
            })
          });
        });
    });
  });