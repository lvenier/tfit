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

    document.write('</br><div><h3> Name : ' + player.name + '</h3></div><div><h3> Score : ' + player.score + '</h3></div></br>')

    document.write('<table id="scoreTable' + cpt + '" class="myTable"><tr><th>song Id</th><th>Score</th><th>L_JAB</th><th>R_JAB</th><th>L_HOOK</th><th>R_HOOK</th><th>L_UCUT</th>\
          <th>R_UCUT</th><th>L_DODGE</th><th>R_DODGE</th><th>D_DODGE</th></tr></table>')

    table = document.getElementById("scoreTable"+cpt);

    for (let i of Object.keys(player.scores)) {
        let row = table.insertRow(-1);
        let c = [];
        for (j = 0; j < 11; j++) {
            c[j] = row.insertCell(j);
        }
        c[0].innerText = i;
        c[1].innerText = player.scores[i].score;
        for (j of Object.keys(player.scores[i])) {
            if (j === "score") continue;
            if (j === "count") continue;
            if (j === 10) continue;
            if (c.length > player.scores[i][j].type + 1) c[player.scores[i][j].type + 1].innerText = player.scores[i][j].success + " / " + player.scores[i][j].total
        }
    }
}