var tmp = JSON.parse(localStorage.getItem("player")) || {
    "name": (Math.random() + 1).toString(36).substring(2),
    "score": 0,
    "scores": {}
};
var players = [];
players.push(tmp);

for (let p of Object.keys(localStorage)) {
    if (p.startsWith("player-")) players.push(JSON.parse(localStorage.getItem(p)));
}

let cpt = 0;
for (let player of players) {
    document.write('</br><div><h3><span>Name : ' + player.name + '</span><span style="margin-left: 80px;">Score : ' + player.score + '</span></h3></div></br>')
    document.write('<table id="scoreTable' + cpt + '" class="myTable"><tr><th>song Id</th><th>Score</th><th>Count</th><th>L_JAB</th><th>R_JAB</th><th>L_HOOK</th><th>R_HOOK</th><th>L_UCUT</th>\
          <th>R_UCUT</th><th>L_DODGE</th><th>R_DODGE</th><th>D_DODGE</th></tr></table>')
    table = document.getElementById("scoreTable"+cpt);
    for (let i of Object.keys(player.scores)) {
        let row = table.insertRow(-1);
        if (player.scores[i].score < 10) row.style.color = "red";
        if ('length' in player.scores[i] && player.scores[i].score * 0.8 > player.scores[i].length) row.style.color = "green";
        let c = [];
        for (j = 0; j < 12; j++) {
            c[j] = row.insertCell(j);
        }
        c[0].innerText = i;
        c[1].innerText = player.scores[i].score;
        c[2].innerText = player.scores[i].count || 1;
        for (j of Object.keys(player.scores[i])) {
            if (j === "score") continue;
            if (j === "count") continue;
            if (j === 10) continue;
            if (c.length > player.scores[i][j].type + 2) c[player.scores[i][j].type + 2].innerHTML = player.scores[i][j].success + " / " + player.scores[i][j].total;
        }
    }
    cpt++;
}