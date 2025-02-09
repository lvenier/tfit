var player = JSON.parse(localStorage.getItem("player")) || {
    "name": (Math.random() + 1).toString(36).substring(2),
    "score": 0,
    "scores": {}
  };

document.getElementById("score").innerHTML = player.score;
document.getElementById("name").innerHTML = player.name;

table = document.getElementById("scoreTable");

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
        if (c.length > player.scores[i][j].type+1) c[player.scores[i][j].type+1].innerText = player.scores[i][j].success + " / " + player.scores[i][j].total
    }
}
