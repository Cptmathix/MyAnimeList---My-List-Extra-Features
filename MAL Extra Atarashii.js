// ==UserScript==
// @name         MAL Extra v2
// @version      1.0.0
// @description  Show anime info in your animelist (uses Atarashii API)
// @author       Cpt_mathix
// @match        *://myanimelist.net/animelist/*
// @grant        none
// ==/UserScript==

init();

function init() {
    var table = document.getElementById("list_surround").children;
    for (var i = 0; i < table.length; i++) {
        var cell = table[i].getElementsByTagName('td');

        for (var j = 0; j < cell.length; j++) {  
            // Displays Anime Info
            var hasMore = cell[j].innerHTML.search('More');
            if (hasMore != -1) {
                var animetitle = cell[j].getElementsByClassName('animetitle')[0].innerText;

                // get animeid
                var a = cell[j].getElementsByTagName("a");
                var animeid = a[1].id.match(/\d/g).join("");

                // get table color type
                var tdtype = cell[j].className.match(/\d/g).join("");

                // replace onclick function with my own
                a[1].removeAttribute('onclick');
                a[1].addEventListener('click', displayTable(animetitle, animeid, tdtype) , true); 
            }

            // Not Yet Aired becomes transparant
            var found = cell[j].innerHTML.search('Not Yet Aired');
            if (found != -1) {
                cell[j].setAttribute('style', 'opacity:0.50 !important');
                // table[i].setAttribute('style', 'display:none !important');
            }
        }
    }
}

function requestCrossDomain( site, callback ) {
     
    // If no url was passed, exit.
    if ( !site ) {
        alert('No site was passed.');
        return false;
    }
     
    // Take the provided url, and add it to a YQL query. Make sure you encode it!
    var yql = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="' + site + '"') + '&format=xml&callback=?';
     
    // Request that YSQL string, and run a callback function.
    // Pass a defined function to prevent cache-busting.
    $.getJSON( yql, function(data) { 
        if ( data.results[0] ) {
            // Strip out all script tags, for security reasons.
            // BE VERY CAREFUL. This helps, but we should do more. 
            data = data.results[0].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

            // If the user passed a callback, and it
            // is a function, call it, and send through the data var.
            if ( typeof callback === 'function') {
                callback(data);
            }
        }
        // Else, Maybe we requested a site that doesn't exist, and nothing returned.
        else throw new Error('Nothing returned from getJSON.');
    });    
}

// if this fails to function, look at getExpand(arg1, arg2) function on the myanimelist page
function displayTable(animetitle, animeid, tdtype) {
    return function () {
        var moreObject = $('#more'+animeid);
        var memberId = $('#listUserId').val();

        if (moreObject.css('display') == 'block') {		// Hide if loaded
            moreObject.hide();
            return false;
        } 

        if (moreObject.css('display') == 'none') {		// Show if date is already loaded
            moreObject.show();
        }

        $.post("/includes/ajax-no-auth.inc.php?t=6", {color:tdtype,id:animeid,memId:memberId,type:$('#listType').val()}, function(data) {
            moreObject.html(data.html).show();
            load_img_tags();

            // change info with info from Atarashii API
            var hiddendiv = "more" + animeid;
            var table = document.getElementById(hiddendiv).getElementsByClassName('td' + tdtype + ' borderRBL')[0];
            if (table != null) {
                var url = "api.atarashiiapp.com/2/anime/" + animeid;
                requestCrossDomain(url, function(results) {
                    results = results.replace(/":"|":/g,'"');
                    results = results.split('"');
                    table.innerHTML = displayAnimeInfo(results);
                }); 
            }
        }, "json");
    };
}

function getEntryTag(data, string) {
    var place = data.indexOf(string);
    if (place == -1) 
        return "N/A";
    if (string == "english")
        return data[place + 2].replace(',','');
    if (string == "synopsis") {
        var k = 1;
        var str = "";
        while (data[place + k] != ",") {
            var x = data[place + k].replace(/\\r|\\n/g,'');
            var r = /\\u([\d\w]{4})/gi;
            x = x.replace(r, function (match, grp) {
                return String.fromCharCode(parseInt(grp, 16)); } );
            x = unescape(x);
            str += x.replace(/&lt;\\\/em&gt;/g, "</em>").replace(/\\/g, '');
            k++;
        }
        return str;
    }
    return data[place + 1].replace(',','');
}

function displayAnimeInfo(data) {
    var englishTitle = getEntryTag(data, 'english');
    if (englishTitle == "") {
        englishTitle = getEntryTag(data, 'title');
    }
    
    var rank = getEntryTag(data, 'rank');
    var episodes = getEntryTag(data, 'episodes');
    if (episodes == "0") {
        episodes = "unknown";                
    }
    
    var score = getEntryTag(data, 'members_score');
    var startDate = getEntryTag(data, 'start_date').replace(/\d\d\d\d-\d\d-\d\d/g, function(s) {    
        var dmy = s.split('-');    
        return dmy[2] + '/' + dmy[1] + '/' + dmy[0];    
    });
    
    var endDate = getEntryTag(data, 'end_date').replace(/\d\d\d\d-\d\d-\d\d/g, function(s) {    
        var dmy = s.split('-');    
        return dmy[2] + '/' + dmy[1] + '/' + dmy[0];    
    });
    if (endDate == "00/00/0000") {
        endDate = "unknown";
    }
    
    var status = getEntryTag(data, 'status');
    var synopsis = getEntryTag(data, 'synopsis').replace(/\[i\]/g,"<i>").replace(/\[\/i\]/g,"</i>");
    var image = getEntryTag(data, 'image_url');
    
    var strVar="";
    strVar += "<body>";
    strVar += "<table>";
    strVar += "  <tr>";
    strVar += "    <td>" + "<img src=" + image + ">" + "<\/td>";
    strVar += "    <td valign=\"top\">";
    strVar += "    <b>" + "English:  " + "<\/b>" + englishTitle + "<br>";
    strVar += "    <b>" + "Status:   " + "<\/b>" + status + "<br>";
    strVar += "    <b>" + "Episodes: " + "<\/b>" + episodes + "<br>";
    strVar += "    <b>" + "Score:    " + "<\/b>" + score + "<br>";
    strVar += "    <b>" + "Rank: " + "<\/b>" + rank + "<br>" + "<br>";
    strVar += "    <b>" + "Start-date: " + "<\/b>" + startDate + "<br>";
    strVar += "    <b>" + "End-date:   " + "<\/b>" + endDate + "<br>" + "<br>" + synopsis;
    strVar += "    <\/td>";
    strVar += "  <\/tr>";
    strVar += "<\/table>";
    strVar += "<\/body>";
        
    return strVar;
}