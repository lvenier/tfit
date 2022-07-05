# tfit

sudo docker run -d -p 3000:3000 --label traefik.http.routers.tfit.rule=Host\(\`tfit.lvbh.xyz\`\) --name tfit tfit