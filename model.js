// model.js
var conf = require('./config.json');
var bitcoin = require('bitcoin');
var WebSocket = require('ws');

var wss = new WebSocket.Server({ port: 8080 });

wss.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    };
  });
};

var client = new bitcoin.Client({
host: conf.host,
port: conf.port,
user: conf.user,
pass: conf.pass,
timeout: conf.timeout
});
let stats = {};
let MiningMap = {
  "difficulty": "difficulty",
  "blocks": "blocks",
  "blocktime (min)": "blocktime",
  "blockreward (VRM)": "blockreward",
  "nethashrate (kH/m)": "nethashrate"
};

let getInfo = () => {
  new Promise((resolve, reject) => {
    client.getInfo((err, info) => {
      let json = {};
      if (err) {
        // throw new Error("Error: " + err);
        resolve({"error": err });
        return;
      }
      if (stats.totalsupply != info.totalsupply){
        if (Object.keys(stats).length !== 0) {
          json["totalsupply"] = stats.totalsupply;
        }
        stats.totalsupply = info.totalsupply;
      }
      // console.log("info: " + JSON.stringify(info));

      client.getMiningInfo((err, info) => {
        if (err) {
          // throw new Error("Error: " + err);
          resolve({"error": err });
          return;
        }
        for (stat in MiningMap) {
          if (stats[MiningMap[stat]] != info[stat]){
            if (Object.keys(stats).length == Object.keys(MiningMap).length + 1) {
              json[MiningMap[stat]] = info[stat];
            }
            stats[MiningMap[stat]] = info[stat];
          }
        }
        resolve(json);
      });
    });

  })
  .then((json) => {
    // console.log(stats);
    if (Object.keys(json).length !== 0) {
      wss.broadcast(json);
      // console.log(json);
    }
    setTimeout(getInfo, conf.timeout);
  })
  .catch((err) => {
    console.log(err);
  });
};

var db = (req, res, next) => {
  req.app.locals.db = stats;
  next();
}

exports.db = db;
exports.getInfo = getInfo;
