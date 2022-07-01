const datas = [];
const key = localStorage.getItem('key')

if (key === null) window.location.replace("/login.html");

const socket = io({
    query: {
        "from": "home"
    }
});

$.ajax({
    url: "/api/login?key=" + key
  }).done(function(result) {
    if (result.status !== "success") {
        window.location.replace("/login.html");
    }
  });

$(document).ready(function () {

    $(".nav-link").on('click', function(){
        $(".nav-link").each(function() {
            $("#" + $(this).html().toLowerCase() + "-page").addClass('d-none');
        })
        $("#" + $(this).html().toLowerCase() + "-page").removeClass('d-none');
        $("#devices").addClass("d-none")
        if (["boxing", "fitness", "dancing"].includes($(this).html().toLowerCase())) $("#devices").removeClass("d-none")
    })

    socket.on("action", (msg) => {
        if ("position" in msg) {
            switch (msg.name) {
                case "connect":
                    $("#" + msg.position.replace(" ", "")).removeClass("text-success").addClass("text-primary")
                    break;
                case "disconnect":
                    $("#" + msg.position.replace(" ", "")).removeClass("text-success").removeClass("text-primary")
                    break;
                case "changetype":
                    $("#" + msg.position.replace(" ", "")).removeClass("text-success").addClass("text-primary")
                    break;
                case "straight":
                    $("#" + msg.position.replace(" ", "")).removeClass("text-primary").addClass("text-success")
                    $("#boxing_" + msg.position.replace(" ", "") + msg.name).removeClass("text-success").addClass("text-success")
                    setTimeout(function () {
                        $("#boxing_" + msg.position.replace(" ", "") + msg.name).removeClass("text-success");
                    }, 500);
                    break;
            }
        }
    })

    socket.on("data", (msg) => {
        datas.push(msg)
        if (datas.length > 500) datas.shift();
    })
})