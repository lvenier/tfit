var guest = JSON.parse(localStorage.getItem("player")) || {
    "name": (Math.random() + 1).toString(36).substring(2),
    "score": 0,
    "scores": {}
};
var players = [];
var cpt = 0;
var html = "";
var songs = {};

const xhr = new XMLHttpRequest();
xhr.open("GET", "/db/songs.json");
xhr.send();
xhr.responseType = "json";
xhr.onload = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
        songs = xhr.response;
    }
}

function loadPlayers() {
    players = [];
    for (let p of Object.keys(localStorage)) {
        if (p.startsWith("player-")) {
            let pj = JSON.parse(localStorage.getItem(p));
            pj.id = p;
            players.push(pj);
        }
    }
}

function display(player) {
    html += ('</br><div><h3><span>Name : ' + player.name + '</span><span style="margin-left: 80px;">Score : ' + player.score + '</span></h3></div>')
    if (Object.keys(player.scores).length  > 0) html += ('<br><table id="scoreTable' + cpt + '" class="myTable"><tr><th>Song Id</th><th>Length</th><th>Score</th><th>Count</th><th>L_JAB</th><th>R_JAB</th><th>L_HOOK</th><th>R_HOOK</th><th>L_UCUT</th>\
          <th>R_UCUT</th><th>L_DODGE</th><th>R_DODGE</th><th>D_DODGE</th></tr>')
    for (let i of Object.keys(player.scores)) {
        if (player.scores[i].score < 5) html += '<tr style="color:red">';
        if ('length' in player.scores[i] && player.scores[i].score * 0.8 > player.scores[i].length) html += '<tr style="color:green">';
        html += '<td>' + i + '</td>';
        html += '<td>' + (player.scores[i].length || 0) + '</td>';
        html += '<td>' + (player.scores[i].score) + '</td>';
        html += '<td>' + (player.scores[i].count || 1) + '</td>';
        let cnt = 1;
        for (j of Object.keys(player.scores[i])) {
            if (["score","count","length"].includes(j)) continue;
            while (cnt < parseInt(j)) {
                html += '<td></td>';
                cnt++;
            }
            html += '<td>' + player.scores[i][j].success + " / " + player.scores[i][j].total + '</td>';
            cnt++;
        }
        html += '</tr>';
    }
    html += '</table>';
    document.getElementById('me').innerHTML = html;
}

function init() {
    cpt = 0;
    loadPlayers();
    html = "";
    display(guest);
    cpt++;
    for (let player of players) {
        display(player);
        cpt++;
    }
}

init();

document.getElementById('clear').addEventListener("click", function(){
    guest = {
        "name": (Math.random() + 1).toString(36).substring(2),
        "score": 0,
        "scores": {}
    };
    localStorage.setItem("player",JSON.stringify(guest));
    for (let player of players) {
        let tmp_player = JSON.parse(JSON.stringify(player));
        tmp_player.scores = {};
        for (let i of Object.keys(player.scores)) {
            if (player.scores[i].score > 5) tmp_player.scores[i] = player.scores[i];
            if (!("length" in player.scores[i]) || parseInt(player.scores[i]["length"]) === 0) {
                if ("length" in songs[parseInt(i)]) tmp_player.scores[i]["length"] = songs[parseInt(i)]["length"];
            }
        }
        localStorage.setItem(tmp_player.id,JSON.stringify(tmp_player));
    }   
    init();
});