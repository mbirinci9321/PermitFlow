from PIL import Image
import sys

# Convert PNG to ICO
img = Image.open('packaging/icon.png')
img.save('packaging/app.ico', format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (32, 32)])
print("Converted icon.png to app.ico")
