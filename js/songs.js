
table = document.getElementById("songs");

const xhr = new XMLHttpRequest();
xhr.open("GET", "/db/songs.json");
xhr.send();
xhr.responseType = "json";
xhr.onload = () => {
  if (xhr.readyState == 4 && xhr.status == 200) {
    const data = xhr.response;
    let cpt = 1;
    for (const d of data) {
        let row = table.insertRow(-1);
        let c = [];
        for (j = 0; j < 5; j++) {
            c[j] = row.insertCell(j);
        
        }
        c[0].innerText = cpt;
        c[1].innerText = d.name;
        c[2].innerText = d.author;
        c[3].innerText = d.length;
        c[4].innerText = d.moves.length;
        cpt++;
    }
  } else {
    console.log(`Error: ${xhr.status}`);
  }
};
