# tfit

Box4Fit is a webcam-controlled boxing fitness game built with p5.js and ml5.js pose detection.

## Local

Run a local static server:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

Camera access usually requires `localhost` or HTTPS. If you test from another device on your network, use HTTPS or the Electron app.

## Electron

```bash
npm install
npm start
```

## SaaS

```bash
sudo docker run -d -p 8000:8000 --label traefik.http.routers.box4fit.rule=Host\(\`tfit.lvbh.xyz\`\) --name tfit tfit
```
