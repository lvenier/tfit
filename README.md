# tfit

## Local

LOCAL=1 npm start

PC : https://localhost:3000

PC Debug Mobile : https://localhost:3000/debug

Mobile : https://localhost:3000/mobile

## Saas

sudo docker run -d -p 3000:3000 --label traefik.http.routers.tfit.rule=Host\(\`tfit.lvbh.xyz\`\) --name tfit tfit
