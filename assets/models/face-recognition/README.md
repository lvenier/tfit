# Face Recognition Models

Place local browser model files here:

- `500m.onnx`: SCRFD face detector, preferably 640x640 NCHW RGB input with stride 8/16/32 outputs.
- `w600k_mbf.onnx`: face embedding model, preferably 112x112 NCHW RGB input with a normalized embedding output.

The proof of concept loads these files from this directory only. Do not configure CDN, cloud, or API URLs for these paths if you want recognition to remain fully local.
