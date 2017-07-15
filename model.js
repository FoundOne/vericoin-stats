// model.js
'use strict';
var conf = require('./config.json');
var bitcoin = require('bitcoin');
var WebSocket = require('ws');

var geoip2 = require("geoip2");
geoip2.init();

var wss = new WebSocket.Server({
  port: 8080,
  perMessageDeflate: false
});

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
        let stat = 0;
        for (stat in MiningMap) {
          if (stats[MiningMap[stat]] != info[stat]){
            if (Object.keys(stats).length >= Object.keys(MiningMap).length + 1) {
              json[MiningMap[stat]] = info[stat];
            }
            stats[MiningMap[stat]] = info[stat];

            // block_data
            if (stat == "blocks"){
              client.cmd("getblockbynumber", info[stat], (err, block) => {
               // console.log(block);
               let block_data = {
                "height": block.height,
                "age": block.time,
                "size": block.size,
                "transactions": block.tx.length,
                "sent": block.mint
               };
               // console.log({ "block_data": block_data });
               wss.broadcast({ "block_data": block_data });
               if (stats["block_data"] === undefined) {
                 stats["block_data"] = [];
               }
               stats["block_data"].push(block_data);
               if (stats["block_data"].length > 12) {
                 stats["block_data"].shift();
               }
              });
              
              // nethashrate_log
              if (stats["netahashrate_log"] === undefined) {
               stats["netahashrate_log"] = [];
              }
              // console.log({ "netahashrate_log": info["nethashrate (kH/m)"] });
              stats["netahashrate_log"].push(info["nethashrate (kH/m)"]);
              if (stats["netahashrate_log"].length > 12) {
                 stats["netahashrate_log"].shift();
              }

              // blocktime_log
              if (stats["blocktime_log"] === undefined) {
               stats["blocktime_log"] = [];
              }
              // console.log({ "blocktime_log": info["blocktime (min)"] });
              stats["blocktime_log"].push(info["blocktime (min)"]);
              if (stats["blocktime_log"].length > 12) {
                 stats["blocktime_log"].shift();
              }
              wss.broadcast({ 
              "netahashrate_log": info["nethashrate (kH/m)"],
              "blocktime_log": info["blocktime (min)"]
              });
            }
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

// geoip lookup
let ips = new Object();
let loc_numbers = new Object();
let geoLocate = () => {
    client.cmd("getpeerinfo", (err, peers) => {
     //console.log(peers);
     let no = 0;
     for (no in peers){
      let ip = peers[no].addr.substr(0, peers[no].addr.length - 6);
      if (ips[ip] === undefined) {
        ips[ip] = new Object();
      }
      if (ips[ip].timeStamp === undefined) {
        // console.log(ip);
        geoip2.lookupSimple(ip, (error, result) => {
          if (error || result === null || result === 'unidentified'){
            return;
          }
          // console.log(result.country);
          if(loc_numbers[result.country] === undefined){
            loc_numbers[result.country] = 0;
          }
          loc_numbers[result.country] += 1;
          ips[ip].country = result.country;
          wss.broadcast({"inc_country": result.country})
        });
        // console.log(JSON.stringify(loc_numbers));
      }
      ips[ip].timeStamp = Date.now();
     }
    });
    setTimeout(geoLocate, 5000);
}

// janitor
let janitor = () => {
  for (let ip in ips) {
    if(ips[ip].timeStamp < Date.now() - 86400000){
      console.log(ip + " " + ips[ip].country + " creared");
      if (ips[ip].country) {
        loc_numbers[ips[ip].country] -= 1;
        wss.broadcast({"dec_country": ips[ip].country})
      }
      delete ips[ip];
    }
  }
  setTimeout(janitor, 3600000); // Do it hourly.
}

// express middleware
var db = (req, res, next) => {
  // janitor();
  req.app.locals.db = stats;
  req.app.locals.loc_num = loc_numbers;
  next();
}

exports.db = db;
exports.loc_numbers = loc_numbers;
exports.getInfo = getInfo;
exports.geoLocate = geoLocate;
exports.janitor = janitor;
