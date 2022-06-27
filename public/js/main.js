const datas = [];
const socket = io({
    query: {
        "from": "home"
    }
});

$(document).ready(function () {
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