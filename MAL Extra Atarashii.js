// ==UserScript==
// @name         MyAnimeList(MAL) - Extra v2
// @version      2.0.0
// @description  Show anime/manga info in your animelist/mangalist
// @author       Cpt_mathix
// @match        *://myanimelist.net/animelist/*
// @match        *://myanimelist.net/mangalist/*
// @license      GPL version 2 or any later version; http://www.gnu.org/licenses/gpl-2.0.txt
// @grant        none
// @namespace https://greasyfork.org/users/16080
// ==/UserScript==

var type = "";
if(window.location.href.indexOf("mangalist") > -1) {
    type = "manga";
} else {
    type = "anime";
}

init(type);

function init(type) {
    var table = document.getElementById("list_surround").children;
    for (var i = 0; i < table.length; i++) {
        var cell = table[i].getElementsByTagName('td');

        for (var j = 0; j < cell.length; j++) {  
            // Displays Anime Info
            var hasMore = cell[j].innerHTML.search('More');
            if (hasMore != -1) {
                // get titleid
                var a = cell[j].getElementsByTagName("a");
                var titleid = a[1].getAttribute('onclick').match(/\d.*,/g).join("").replace(',',"");

                // get table color type
                var tdtype = cell[j].className.match(/\d/g).join("");

                // replace onclick function with my own
                a[1].removeAttribute('onclick');
                a[1].addEventListener('click', displayTable(titleid, tdtype, type) , true); 
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
     
    // Take the provided url, and add it to a YQL query.
    var yql = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="' + site + '"') + '&format=xml&callback=?';
     
    // Request that YSQL string, and run a callback function.
    $.getJSON( yql, function(data) { 
        if ( data.results[0] ) {
            // Strip out all script tags, for security reasons. 
            data = data.results[0].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

            // If the user passed a callback, and it
            // is a function, call it, and send through the data var.
            if ( typeof callback === 'function') {
                callback(data);
            }
        } else {
            alert("Atarashii API returned an error");
        }
    });    
}

// if this fails to function, look at getExpand(arg1, arg2) function on the myanimelist page
function displayTable(titleid, tdtype, type) {
    return function () {
        var moreObject = $('#more'+titleid);
        var memberId = $('#listUserId').val();

        if (moreObject.css('display') == 'block') {		// Hide if loaded
            moreObject.hide();
            return false;
        } 

        if (moreObject.children().length != 0) {		// Show if data is already loaded
            moreObject.show();
            return false;
        }
        
        $.post("/includes/ajax-no-auth.inc.php?t=6", {color:tdtype,id:titleid,memId:memberId,type:$('#listType').val()}, function(data) {
            moreObject.html(data.html).show();

            // change info with info from Atarashii API
            var hiddendiv = "more" + titleid;
            var table = document.getElementById(hiddendiv).getElementsByClassName('td' + tdtype + ' borderRBL')[0];
            if (table != null) {
                table.innerHTML = "Fetching data from Atarashii API"
                var url = "api.atarashiiapp.com/2/" + type + "/" + titleid;
                // get anime/manga info from the Atarashi API
                requestCrossDomain(url, function(results) {
                    // remove html tags
                    results = results.replace(/\<body\>|\<\/.*\>/g, "");
                    // parse results into readable format
                    results = JSON.parse(results);
                    table.innerHTML = displayInfo(results, type);
                });
            }
        }, "json");
    };
}

function getEntryTag(data, string) {
    var results = data[string];
    if (results == null)
        return "N/A";
    return results;  
}

function displayInfo(data, type) {
    var englishTitle = (getEntryTag(data, 'other_titles'))['english'];
    if (englishTitle == null) {
        englishTitle = (getEntryTag(data, 'other_titles'))['synonyms'];
        if (englishTitle != null) {
            englishTitle = englishTitle[0];
        } else {
            englishTitle = getEntryTag(data, 'title');
        }
    }
    
    var rank = getEntryTag(data, 'rank');
    if (rank == "0") {
        rank = "N/A";                
    }
    var popularity = getEntryTag(data, 'popularity_rank');
    if (popularity == "0") {
        popularity = "N/A";                
    }
    var episodes = getEntryTag(data, type == "anime" ? 'episodes' : 'chapters');
    if (episodes == "0") {
        episodes = "Unknown";                
    }
    var score = getEntryTag(data, 'members_score');
    if (score == "0") {
        score = "N/A";                
    }
    
    var startDate = getEntryTag(data, 'start_date').replace(/\d\d\d\d-\d\d-\d\d/g, function(s) {    
        var dmy = s.split('-');    
        return dmy[2] + '/' + dmy[1] + '/' + dmy[0];    
    });
    
    var endDate = getEntryTag(data, 'end_date').replace(/\d\d\d\d-\d\d-\d\d/g, function(s) {    
        var dmy = s.split('-');    
        return " " + "to " + dmy[2] + '/' + dmy[1] + '/' + dmy[0];    
    });
    if (endDate == "N/A" && episodes == "1") {
        endDate = "";
    } else if (endDate == "N/A") {
        endDate = " " + "to N/A";
    }        
    
    var status = getEntryTag(data, 'status');
    status = status.charAt(0).toUpperCase() + status.slice(1);
    var synopsis = getEntryTag(data, 'synopsis').replace(/&lt;/g,"<").replace(/&gt;/g, ">");
    var image = getEntryTag(data, 'image_url');
    
    var genres = getEntryTag(data, 'genres');
    for	(i = 1; i < genres.length; i++) {
        genres[i] = " " + genres[i];
    }
    
    var strVar="";
    strVar += "<body>";
    strVar += "<table>";
    strVar += "  <tr>";
    strVar += "    <td rowspan=\"2\">" + "<img src=" + image + ">" + "<\/td>";
    strVar += "    <td valign=\"top\" width=\"50%\">" 
    strVar += "    <b>" + "English:  " + "<\/b>" + englishTitle + "<br>"
    strVar += "    <b>" + "Status:   " + "<\/b>" + status + "<br>";
    strVar += "    <b>" + (type == "anime" ? "Episodes: " : "Chapters: ") + "<\/b>" + episodes + "<br>";
    strVar += "    <b>" + "Score:    " + "<\/b>" + score + "<br>";
    strVar += "    <b>" + "Rank: " + "<\/b>" + rank + "<br>";
    strVar += "    <b>" + "Popularity: " + "<\/b>" + popularity + "<br>";
    type == "anime" ? (strVar += "    <b>" + "Aired: " + "<\/b>" + startDate + endDate + "<br>") : "";
    strVar += "    <\/td>";
    strVar += "    <td valign=\"top\" align=\"right\" width=\"50%\">" + genres + "<\/td>";   
    strVar += "  <\/tr>";
    strVar += "  <tr>";
    strVar += "    <td valign=\"top\" colspan=\"2\" width=\"100%\" height=\"100%\">" + "<br>" + synopsis + "<\/td>";
    strVar += "  <\/tr>";
    strVar += "<\/table>";
    strVar += "<\/body>";
        
    return strVar;
}