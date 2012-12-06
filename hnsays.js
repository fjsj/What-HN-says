function startsWith(data, input) {
  return data.substring(0, input.length) === input;
}

function getStory(url, callback) {
  //console.log("Started getting story: " + url);
  //var currentTime = new Date().getTime();

  // http://www.w3.org/TR/XMLHttpRequest/
  // HN search API: http://www.hnsearch.com/api
  var req = new XMLHttpRequest();
  req.open( 
      "GET",
      "http://api.thriftdb.com/api.hnsearch.com/items/_search" +
      "?weights[title]=0.0&weights[text]=0.0&weights[url]=1.0" +
      "&weights[domain]=0.0&weights[username]=0.0&weights[type]=0.0" +
      "&q=" + encodeURIComponent(url),
      true);
  req.onload = parseJSON;
  req.send(null);

  function parseJSON() {
    //console.log("Finished getting story, took ms: " + (new Date().getTime() - currentTime));
    var json = JSON.parse(req.responseText);
    var result0 = json.results[0];
    if (result0) {
      callback(result0.item);
    } else {
      callback(null);
    }
  }
}

function createIconImageData(points) {
  // http://www.w3.org/TR/2dcontext/
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext('2d');

  // Draw rectangle with HN orange
  ctx.strokeStyle = "#F60";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 19, 19);

  // Draw triangle filled with HN grey
  ctx.fillStyle = "#9A9A9A";
  ctx.beginPath();
  ctx.moveTo(6, 16);
  ctx.lineTo(9, 10);
  ctx.lineTo(10, 10);
  ctx.lineTo(13, 16);
  ctx.fill();

  // Assure 3 digit points
  if (points > 999) {
    points = 999;
  }

  // Draw points counter
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.font = '6pt Verdana, "Bitstream Vera Sans", "DejaVu Sans", Tahoma, Geneva, Arial, sans-serif';
  ctx.fillText(points, 9, 9, 19);
  
  // Return ImageData from canvas
  return ctx.getImageData(0, 0, 19, 19);
}

function updateIcon(points, tabId) {
  chrome.pageAction.setIcon({"imageData": createIconImageData(points), "tabId": tabId});
  chrome.pageAction.show(tabId);
}

// Navigation completed event: searchs for page url on HN API
// http://developer.chrome.com/extensions/webNavigation.html#event-onCompleted
chrome.webNavigation.onCompleted.addListener(function(details) {
  var tabId = details.tabId;
  var url = details.url;
  if (!startsWith(url, 'http://news.ycombinator.com')) {
    function updateState(story) {
      if (story) {
        updateIcon(story.points, tabId);
        var storyObj = {};
        storyObj[url] = story;
        chrome.storage.local.set(storyObj, function() {
          if (chrome.runtime.lastError) {
            //console.log(chrome.runtime.lastError);
          }
        });
      } else {
        // Story not found on HN
      }
    }

    getStory(url, updateState);
  }
}, {url: [{schemes: ['http', 'https']}]});

// Click on page action icon event: opens new tab with HN discussion page
// http://developer.chrome.com/extensions/pageAction.html#event-onClicked
chrome.pageAction.onClicked.addListener(function(tab) {
  var url = tab.url;
  chrome.storage.local.get(url, function(result) {
    var story = result[url];
    if (story) {
      var discussionUrl = "http://news.ycombinator.com/item?id=" + story.id;
      chrome.tabs.create({'url': discussionUrl}, function(tab) {
        // Tab opened
      });
    }
  });
});
