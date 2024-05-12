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
    maxHeight: `${node_height - MARGIN * 2}px`,
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

        const widget0 = {
          name: "webcam_selector",
          draw(ctx, node, widget_width, y) {
            Object.assign(
              this.inputEl.style,
              get_position_style(ctx, widget_width, y, node.size[1])
            );
          },
          inputEl: document.createElement("select"),
        };

        const widget = {
          name: "webcam",
          draw(ctx, node, widget_width, y) {
            Object.assign(
              this.inputEl.style,
              get_position_style(ctx, widget_width, y, node.size[1])
            );
          },
          inputEl: document.createElement("button"),
        };

        const widget2 = {
          name: "webcam_image",
          draw(ctx, node, widget_width, y) {
            Object.assign(
              this.inputEl.style,
              get_position_style(ctx, widget_width, y + 50, node.size[1])
            );
          },
          inputEl: document.createElement("img"),
        };

        const widget3 = {
          name: "webcam_stop",
          draw(ctx, node, widget_width, y) {
            Object.assign(
              this.inputEl.style,
              get_position_style(ctx, widget_width, y, node.size[1])
            );
          },
          inputEl: document.createElement("button"),
        };

        widget.inputEl.textContent = "Start Capture";
        widget.inputEl.className = "start-capture";

        widget3.inputEl.textContent = "Stop Capture";
        widget3.inputEl.className = "stop-capture";

        let captureInterval;

        widget0.inputEl.onchange = async () => {
          if (captureInterval) {
            console.warn("Switching cameras while capturing is not supported.");
            return;
          }
          // Change camera based on selected option
          const videoConstraints = {
            deviceId: { exact: widget0.inputEl.value }
          };
          console.log("Camera switched to:", videoConstraints.deviceId.exact);
        };

        // Fetch all video input devices
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          devices.forEach((device) => {
            if (device.kind === "videoinput") {
              const option = document.createElement("option");
              option.value = device.deviceId;
              option.text = device.label || `Camera ${widget0.inputEl.length + 1}`;
              widget0.inputEl.appendChild(option);
            }
          });
        });

        widget.inputEl.onclick = async () => {
          try {
            const selectedDeviceId = widget0.inputEl.value;
            const constraints = {
              video: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined },
              audio: false
            };
            captureInterval = setInterval(async () => {
              const stream = await navigator.mediaDevices.getUserMedia(constraints);
              console.log(stream);
              const video = document.createElement("video");
              video.srcObject = stream;
              video.play();

              await new Promise((resolve) => (video.onplaying = resolve));
              await new Promise((resolve) => setTimeout(resolve, 300));

              stream.getTracks().forEach((track) => track.stop());

              const canvas = document.createElement("canvas");
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(video, 0, 0);

              widget2.inputEl.src = canvas.toDataURL("image/png");

              canvas.toBlob((blob) => {
                api.fetchApi("/webcam_capture", {
                  method: "POST",
                  body: blob,
                }).then((response) => response.json())
                  .then((data) => console.log(data))
                  .catch((error) => console.error("Error uploading image:", error));
              });
            }, 1000);
          } catch (error) {
            console.error("Error capturing image:", error);
          }
        };

        widget3.inputEl.onclick = () => {
          if (captureInterval) {
            clearInterval(captureInterval);
            captureInterval = null;
            console.log("Capture stopped.");
          }
        };

        document.body.appendChild(widget0.inputEl);
        document.body.appendChild(widget.inputEl);
        document.body.appendChild(widget2.inputEl);
        document.body.appendChild(widget3.inputEl);

        this.addCustomWidget(widget0);
        this.addCustomWidget(widget);
        this.addCustomWidget(widget2);
        this.addCustomWidget(widget3);
        this.onRemoved = function () {
          widget0.inputEl.remove();
          widget.inputEl.remove();
          widget2.inputEl.remove();
          widget3.inputEl.remove();
        };
        this.serialize_widgets = false;

        orig_nodeCreated?.apply(this, arguments);
      };
    }
  },
});
