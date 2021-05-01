const fs = require('fs');
const http = require('http');
const axios = require('axios');
const cheerio = require('cheerio');
const async = require('async');

const { dialog } = require('electron').remote;

function showError(text) {
  const messageContainer = document.querySelector('.message');
  messageContainer.className = "message error";
  messageContainer.textContent = text;
  
  document.getElementById("start").className = "play";
  document.querySelector(".form").className = "form";
  workStatus = false;
}

let syncedCount = 0;
function increaseFileCounter() {
  syncedCount++;
  document.getElementById("counter").textContent = syncedCount;
}

// Download and save
var download = function (url, dest, cb) {
  console.log('Download: '+url);
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function (response) {
    response.pipe(file);
    file.on('finish', function () {
      console.log("Ok: "+url);
      increaseFileCounter();
      file.close(cb); // close() is async, call cb after close completes.
    });
  }).on('error', function (err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

// Get files from SD Card and save to folder
let workStatus = false;
let inProcess = false;
let downloadedList = [];

function start() {

  const input = document.getElementById("input").value;
  const output = document.getElementById("output").value;

  console.log();
  console.log('Start iteration');
  inProcess = true;

  // Get all files from output folder
  const filesNow = [];
  fs.readdirSync(output).forEach(file => {
    filesNow.push(file);
  });

  axios.get(input)
    .then((response) => {
      if (response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);

        const files = [];
        $('pre a').map(function (i, el) {
          const href = $(this).attr('href');
          if (href.includes("download")) {

            const filename = href.split("file=")[1];
            // if (!filesNow.includes(filename)) {
            if (!downloadedList.includes(href)) {
              files.push({
                "href": href,
                "name": downloadedList.length+"."+filename.split(".")[1]
                // "name": filename
              })
            }

          }
        });

        async.eachLimit(files, 2, function (file, next) {
          downloadedList.push(file.href);
          download(file.href, output+'/'+file.name, next);
        }, function () {
          console.log('Finished');
          inProcess = false;
        })
      }
    })
    .catch((err) => {
      showError(err);
      inProcess = false;
    });
}

setInterval(function(){
  if (workStatus) {
    if (!inProcess) {
      start();
    } else {
      console.log('Previous work is not completed');
    }
  } else {
    console.log('No need to work');
  }
}, 5000);


// Client actions
document.getElementById("start").onclick = function() {
  const className = document.getElementById("start").className;
  if (className == "play") {
    // Start working
    const input = document.getElementById("input").value;
    const output = document.getElementById("output").value;
    if (output == "" || input == "") {
      showError("Choose url and output folder");
    } else {
      document.getElementById("start").className = "play in-process";
      document.querySelector(".form").className = "form disabled";
      document.querySelector(".message").className = "message hide";
      workStatus = true;
    }
  } else {
    // Stop
    document.getElementById("start").className = "play";
    document.querySelector(".form").className = "form";
    workStatus = false;
  }
}

// Folder choose
document.getElementById("output").onclick = function(event) {
  let path = "";
  dialog.showOpenDialog({
    properties: ['openDirectory','createDirectory']
  }).then(result => {
    if (!result.canceled && result.filePaths) {
      path = result.filePaths[0];
      document.getElementById("output").value = path;
    }
  }).catch(err => {
    showError(err)
  })
};