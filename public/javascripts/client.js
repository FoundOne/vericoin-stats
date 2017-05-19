// client.js
document.addEventListener("DOMContentLoaded", () => {
  var ws = new WebSocket("ws://127.0.0.1:8080/");

  ws.onmessage = (event) => {
    console.log(event.data);
    let stats = JSON.parse(event.data);
    for (stat in stats) {
      if (stat != "error"){
        dom_stat = document.getElementById(stat);
        new_stat = document.createTextNode(stat + ": " + stats[stat]);
        dom_stat.replaceChild(new_stat, dom_stat.firstChild);
      }
    }
  };

});
