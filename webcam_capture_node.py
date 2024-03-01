import torch
import numpy as np

from PIL import Image, ImageOps, ImageSequence


class WebcamCaptureNode:
    CATEGORY = "Webcam"
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {
            "seed": ("INT", {"default": 0, "min": 0, "max": 0xffffffffffffffff}),
        }}
        
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("captured_image",)
    FUNCTION = "capture_image"

    def capture_image(self, seed):
        # Load the saved image file or process as needed
        image_path = "captured_image.png"  # Assuming the image was saved with this name
        # with open(image_path, "rb") as img_file:
        #     image_data = img_file.read()
        #     pil_image = Image.open(image_path)
        image_data = Image.open(image_path)

        output_images = []
        for i in ImageSequence.Iterator(image_data):
            i = ImageOps.exif_transpose(i)
            if i.mode == 'I':
                i = i.point(lambda i: i * (1 / 255))
            image = i.convert("RGB")
            image = np.array(image).astype(np.float32) / 255.0
            image = torch.from_numpy(image)[None,]
            if 'A' in i.getbands():
                mask = np.array(i.getchannel('A')).astype(np.float32) / 255.0
                mask = 1. - torch.from_numpy(mask)
            else:
                mask = torch.zeros((64,64), dtype=torch.float32, device="cpu")
            output_images.append(image)

        if len(output_images) > 1:
            output_image = torch.cat(output_images, dim=0)
        else:
            output_image = output_images[0]

        # Convert the image data to a format suitable for your needs
        # For example, return a path, base64 encoded string, etc.
        print("Returning image data...")
        return (output_image,)
