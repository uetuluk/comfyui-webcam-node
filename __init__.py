from .webcam_capture_node import WebcamCaptureNode
from .server_extension import *

# Register the custom node
NODE_CLASS_MAPPINGS = {
    "webcam_capture_node": WebcamCaptureNode
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "webcam_capture_node": "Webcam Capture"
}

WEB_DIRECTORY = "./js"

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'WEB_DIRECTORY']