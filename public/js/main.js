const datas = [];
const key = localStorage.getItem('key')

if (key === null) window.location.replace("/login.html");

const socket = io({
    query: {
        "from": "home"
    }
});
var gtimer = null;
var audio = null;
var CURRENTGAME = 0;

$.ajax({
    url: "/api/login?key=" + key
  }).done(function(result) {
    if (result.status !== "success") {
        window.location.replace("/login.html");
    }
  });

  function playBoxing() {
    CURRENTGAME = Math.floor(Math.random() * BOXING.length)
    audio = new Audio(BOXING[CURRENTGAME].audio);
    audio.pause();
    audio.load()
    $("#boxing-position").addClass("pulse");
    $("#boxing-again").addClass("d-none")
    $("#boxing-timer").html("0")
    $("#boxing-spinner-count").html("3");
    $("#boxing-spinner").removeClass("d-none");
    $('#default-boxing').addClass('d-none');
    $('#play-boxing').removeClass('d-none');
    let row = '<div class="row m-5"><div class="marquee-rtl"><h3 class="text-primary" style="opacity:0.8;">Title: ' + BOXING[CURRENTGAME].title + ' - Author: ' + BOXING[CURRENTGAME].author + ' - Song: ' + BOXING[CURRENTGAME].songtitle +'</h3></div></div>';
    row +='<div class="row my-5">';
    let cpt = 0;
    for (const a of BOXING[CURRENTGAME].series) {
        if (cpt % 4 === 0) row += '</div><div class="row my-5">';
        let gpos = '0';
        if (a[0] === 'L' && a[1] === 'H') gpos = '90';
        if (a[0] === 'R' && a[1] === 'H') gpos = '-90';
        if (a[1] === 'S') gpos = '180';
        row += '<div class="col-sm-12 col-md-3" id="boxing_action_' + cpt + '"><img width="40%" src="/img/' + ( (a[0] === 'L') ? 'left' : 'right') + '.png" ' + (cpt === 0 ? 'class="pulse-gloves"' : '' )  + ' style="transform: rotate(' + gpos + 'deg);opacity: 0.5;" id="boxing_action_' + cpt + '_img" /></div>'
        cpt++;
    }
    row += '</div>';
    $("#boxing-game").html(row)
    $("#boxing_action_0_img").css('opacity', '1.0')
    gtimer = setInterval(function() {
        let s = parseInt($("#boxing-spinner-count").html() - 1)
        $("#boxing-spinner-count").html(s)
        if (s <= 0) {
            if (s === 0) audio.play()
            $("#boxing-spinner").addClass("d-none");
            $("#boxing-timer").html(parseInt($("#boxing-timer").html()) + 1)
        }
        if (parseInt($("#boxing-timer").html()) > BOXING[CURRENTGAME].time) {
            $("#boxing-timer").html("0")
            $("#boxing-position").removeClass("pulse");
            $("#boxing-spinner-count").html("3");
            $("#boxing-again").removeClass("d-none");
            for (let i = 0; i < 16; i++) { 
                $("#boxing_action_" + i + "_img").css('opacity', '0.5')
                $("#boxing_action_" + i + "_img").removeClass("pulse-gloves");
            }
            audio.pause();
            clearInterval(gtimer);
            gtimer = null;
        }
    }, 1000)
}

$(document).ready(function () {

    new QRCode(document.getElementById("qrcode"), {
        text: window.location.href + 'mobile',
        width: 128,
        height: 128,
    });

    $(".nav-link").on('click', function(){

        $(".nav-link").each(function() {
            $("#" + $(this).html().toLowerCase() + "-page").addClass('d-none');
            $(this).removeClass("active")
        })
        $(this).addClass("active")
        $("#" + $(this).html().toLowerCase() + "-page").removeClass('d-none');
        $("#devices").addClass("d-none")
        if (audio) audio.pause();
        if (gtimer) clearInterval(gtimer);
        if (["boxing", "fitness", "dancing"].includes($(this).html().toLowerCase())) $("#devices").removeClass("d-none")
        switch ($(this).html().toLowerCase()){
            case "boxing": 
                $("#boxing-game").html();
                $("#play-boxing").addClass("d-none");
                $("#default-boxing").removeClass("d-none");
                break;
            case "fitness":
                break;
            case "dancing":
                break;
        } 
    })

    socket.on("action", (msg) => {
        if ("position" in msg) {
            switch (msg.name) {
                case "connect":
                    $("#" + msg.position.replace(" ", "")).removeClass("text-white").addClass("text-primary")
                    break;
                case "ping":
                    $("#" + msg.position.replace(" ", "")).removeClass("text-white").addClass("text-primary")
                    break;
                case "disconnect":
                    $("#" + msg.position.replace(" ", "")).removeClass("text-primary").addClass("text-white")
                    break;
                case "changetype":
                    $("#" + msg.position.replace(" ", "")).removeClass("text-white").addClass("text-primary")
                    break;
                case "straight":
                    /*$("#" + msg.position.replace(" ", "")).removeClass("text-primary").addClass("text-success")
                    $("#boxing_" + msg.position.replace(" ", "") + msg.name).removeClass("text-success").addClass("text-success")
                    setTimeout(function () {
                        $("#boxing_" + msg.position.replace(" ", "") + msg.name).removeClass("text-success");
                    }, 500);*/
                    break;
            }
        }
    })

    socket.on("data", (msg) => {
        datas.push(msg)
        if (datas.length > 500) datas.shift();
    })
})