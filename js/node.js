import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";
import { $el } from "../../../scripts/ui.js";

function get_position_style(ctx, widget_width, y, node_height) {
  const MARGIN = 4; // the margin around the html element

  /* Create a transform that deals with all the scrolling and zooming */
  const elRect = ctx.canvas.getBoundingClientRect();
  const transform = new DOMMatrix()
    .scaleSelf(
      elRect.width / ctx.canvas.width,
      elRect.height / ctx.canvas.height
    )
    .multiplySelf(ctx.getTransform())
    .translateSelf(MARGIN, MARGIN + y);

  return {
    transformOrigin: "0 0",
    transform: transform,
    left: `0px`,
    top: `0px`,
    position: "absolute",
    maxWidth: `${widget_width - MARGIN * 2}px`,
    maxHeight: `${node_height - MARGIN * 2}px`, // we're assuming we have the whole height of the node
    width: `auto`,
    height: `auto`,
  };
}

app.registerExtension({
  name: "webcam.capture.extension",
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeType.comfyClass == "webcam_capture_node") {
      console.log("Starting webcam capture extension");
      const orig_nodeCreated = nodeType.prototype.onNodeCreated;
      nodeType.prototype.onNodeCreated = function () {
        console.log("webcam node created");
        const widget = {
          // type: inputdata[0], // whatever
          name: "webcam", // whatever
          draw(ctx, node, widget_width, y) {
            Object.assign(
              this.inputEl.style,
              get_position_style(ctx, widget_width, y, node.size[1])
            ); // assign the required style when we are drawn
          },
        };

        const widget3 = {
          // type: inputdata[0], // whatever
          name: "webcam_stop", // whatever
          draw(ctx, node, widget_width, y) {
            Object.assign(
              this.inputEl.style,
              get_position_style(ctx, widget_width, y, node.size[1])
            ); // assign the required style when we are drawn
          },
        };

        const widget2 = {
          // type: inputdata[0], // whatever
          name: "webcam_image", // whatever
          draw(ctx, node, widget_width, y) {
            Object.assign(
              this.inputEl.style,
              get_position_style(ctx, widget_width, y + 50, node.size[1])
            ); // assign the required style when we are drawn
          },
        };

        // ui.js
        widget.inputEl = document.createElement("button");

        widget.inputEl = document.createElement("button");
        widget.inputEl.textContent = "Start Capture";
        widget.inputEl.className = "start-capture";

        widget3.inputEl = document.createElement("button");
        widget3.inputEl.textContent = "Stop Capture";
        widget3.inputEl.className = "stop-capture";

        widget2.inputEl = document.createElement("img");

        // widget.inputEl.className = "test";
        // widget.inputEl.textContent = "Capture Image";

        let captureInterval;

        widget.inputEl.onclick = async () => {
          if (captureInterval) {
            console.log("Capture already started.");
            return;
          }
          // $el("button", {
          //   textContent: "Capture Image",
          //   onclick: async () => {

          try {
            captureInterval = setInterval(async () => {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 512, height: 512 },
                audio: false,
              });
              console.log(stream);
              const video = document.createElement("video");
              video.srcObject = stream;
              video.play();

              // Wait for the video to start playing
              await new Promise((resolve) => (video.onplaying = resolve));
              // add delay to allow camera to adjust to light
              await new Promise((resolve) => setTimeout(resolve, 300));

              // Stop the video stream
              stream.getTracks().forEach((track) => track.stop());

              // Capture the image
              const canvas = document.createElement("canvas");
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(video, 0, 0);

              // Set the image to the widget
              widget2.inputEl.src = canvas.toDataURL("image/png");

              // Convert canvas to image blob and send to backend
              canvas.toBlob((blob) => {
                // const formData = new FormData();
                // formData.append("image_data", blob);
                console.log(blob);
                api
                  .fetchApi("/webcam_capture", {
                    method: "POST",
                    body: blob,
                  })
                  .then((response) => response.json())
                  .then((data) => console.log(data))
                  .catch((error) =>
                    console.error("Error uploading image:", error)
                  );
              });
            }, 1000);
          } catch (error) {
            console.error("Error capturing image:", error);
          }
        };
        // });

        widget3.inputEl.onclick = () => {
          if (captureInterval) {
            clearInterval(captureInterval);
            captureInterval = null;
            console.log("Capture stopped.");
          }
        };

        document.body.appendChild(widget.inputEl);
        document.body.appendChild(widget2.inputEl);
        document.body.appendChild(widget3.inputEl);

        // console.log(widget);

        this.addCustomWidget(widget);
        this.addCustomWidget(widget2);
        this.addCustomWidget(widget3);
        this.onRemoved = function () {
          widget.inputEl.remove();
          widget2.inputEl.remove();
          widget3.inputEl.remove();
        };
        this.serialize_widgets = false;

        orig_nodeCreated?.apply(this, arguments);

        console.log(this);

        // if (node.box) {
        //   node.box.appendChild(captureButton);
        // }

        // // Add the capture button to the node's UI
        // node.titlebar.appendChild(captureButton);
      };
    }
  },
});
