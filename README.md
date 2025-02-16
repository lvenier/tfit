# tfit

## Local

python3 -m http.server 8000

https://localhost:8000

## Saas

sudo docker run -d -p 8000:8000 --label traefik.http.routers.box4fit.rule=Host\(\`tfit.lvbh.xyz\`\) --name tfit tfit