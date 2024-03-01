from server import PromptServer
from aiohttp import web
import base64
import io
from PIL import Image

routes = web.RouteTableDef()

# @routes.get('/webcam')
# async def return_ok(request):
#     return web.json_response({"status": "success"})

# Add a route to the server API for receiving image data
@routes.post('/webcam_capture')
async def handle_image_upload(request):
    blob_data = await request.read()
    # print(blob_data)
    # image_data = ""
    # image_data = data.get('image_data')
    if blob_data is not None:
        # Decode the base64 image data
        # image_data = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(blob_data))
        
        # Process the image here (e.g., save to a file, pass to another node, etc.)
        # For demonstration, let's just save it to a file
        image.save("captured_image.png")

        return web.json_response({"status": "success"})
    else:
        return web.json_response({"status": "error", "message": "No image data provided"}, status=400)

PromptServer.instance.app.add_routes(routes)