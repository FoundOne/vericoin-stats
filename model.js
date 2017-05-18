// model.js
var conf = require('./config.json');
var bitcoin = require('bitcoin');

var client = new bitcoin.Client({
host: conf.host,
port: conf.port,
user: conf.user,
pass: conf.pass,
timeout: conf.timeout
});
let stats = {};

let getInfo = () => {
  new Promise((resolve, reject) => {
    client.getInfo((err, info) => {
      if (err) {
        throw new Error("Error: " + err);
      }
      stats.totalsupply = info.totalsupply;
      stats.users = info.keypoolsize;
      //console.log("info: " + JSON.stringify(info));

      client.getMiningInfo((err, info) => {
        if (err) {
          throw new Error("Error: " + err);
        }
        stats.difficulty = info.difficulty;
        stats.blocks = info.blocks;
        stats.blocktime = info["blocktime (min)"];
        stats.reward = info["blockreward (VRM)"];
        stats.nethashrate = info["nethashrate (kH/m)"];
        // console.log("mining info:" + JSON.stringify(info));
        resolve(stats);
      });
    });

  })
  .then((json) => {
    // console.log(json);
    setTimeout(getInfo, conf.timeout);
  })
  .catch((err) => {
    console.log(err);
  });
};

var db = (req, res, next) => {
  req.db = stats;
  next();
}

exports.db = db;
exports.getInfo = getInfo;
