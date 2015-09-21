// ==UserScript==
// @name         MAL Extra
// @version      1.1.0
// @description  Show anime info in your animelist
// @author       Cpt_mathix
// @match        *://myanimelist.net/animelist/*
// @grant        none
// @namespace https://greasyfork.org/users/16080
// ==/UserScript==

// Your MyAnimeList Login
var username = " ";
var password = " ";

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

function getAnimeInfo(animetitle, animeid) {
    // API request
    var anime = animetitle.replace(/ /g, "_");
    var xhr = new XMLHttpRequest();
    var url = "";
    if (username == "") {
        var url = "http://myanimelist.net/api/anime/search.xml?q=" + anime;
    } else {
        var url = "http://" + username + ":" + password + "@myanimelist.net/api/anime/search.xml?q=" + anime;
    }
    xhr.open("GET", url, false);
    xhr.setRequestHeader('Content-Type', 'text/xml');
    xhr.send();
    xmlDocument = xhr.responseXML;
    if (xmlDocument != null) {
        var entry = xmlDocument.getElementsByTagName('entry');
        var entryid = xmlDocument.getElementsByTagName('id');    
        for(var k = 0; k < entryid.length; k++) {
            if (entryid[k].textContent == animeid) {
                return entry[k];
            }
        }
    } else {
        return xhr.status;
    }
}

// This info is not being used as of now
/*
function getUserInfo(animetitle, animeid) {
    // API request
    var anime = animetitle.replace(/ /g, "_");
    var xhr = new XMLHttpRequest();
    var url = "http://myanimelist.net/malappinfo.php?u=" + username + "&status=all&type=anime";
    xhr.open("GET", url, false);
    xhr.setRequestHeader('Content-Type', 'text/xml');
    xhr.send();
    xmlDocument = xhr.responseXML;
    return xmlDocument;
}
*/

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

            // change info with info from API request
            var hiddendiv = "more" + animeid;
            var table = document.getElementById(hiddendiv).getElementsByClassName('td' + tdtype + ' borderRBL')[0]
            if (table != null) {
                var entry1 = getAnimeInfo(animetitle, animeid);
                // var entry2 = getUserInfo(animetitle, animeid);
                var entry2 = false;
                if (entry1 == "200") {
                    table.innerHTML = "There seems to be an error... Sorry <br> I know that some animetitles do not work and will try to find a solution in the future <br> Broken titles: Gintama, Kingdom, Tokyo Ghoul, Tokyo Ghoul √A, Shiki, ..."
                } else if (entry1 == "401") {
                    table.innerHTML = "Your login is wrong! <br> Please check if your username and password are correct in the script-code <br> If it worked before, I probably updated the script and you need to re-enter your login in the script"
                } else {
                    table.innerHTML = displayAnimeInfo(entry1, entry2);
                }
            }
        }, "json");
    };
}

function getEntryTag(entry1, string) {
    return entry1.getElementsByTagName(string)[0].textContent;
}

function displayAnimeInfo(entry1, entry2) {
    var englishTitle = getEntryTag(entry1, 'english');
    if (englishTitle == "") {
        englishTitle = getEntryTag(entry1, 'title');
    }
    
    var synonyms = getEntryTag(entry1, 'synonyms');
    var episodes = getEntryTag(entry1, 'episodes');
    if (episodes == "0") {
        episodes = "unknown";                
    }
    
    var score = getEntryTag(entry1, 'score');
    var startDate = getEntryTag(entry1, 'start_date').replace(/\d\d\d\d-\d\d-\d\d/g, function(s) {    
        var dmy = s.split('-');    
        return dmy[2] + '/' + dmy[1] + '/' + dmy[0];    
    });
    
    var endDate = getEntryTag(entry1, 'end_date').replace(/\d\d\d\d-\d\d-\d\d/g, function(s) {    
        var dmy = s.split('-');    
        return dmy[2] + '/' + dmy[1] + '/' + dmy[0];    
    });
    if (endDate == "00/00/0000") {
        endDate = "unknown";
    }
    
    var status = getEntryTag(entry1, 'status');
    var synopsis = getEntryTag(entry1, 'synopsis');
    var image = getEntryTag(entry1, 'image');
    
    var strVar="";
    strVar += "<body>";
    strVar += "<table>";
    strVar += "  <tr>";
    strVar += "    <td>" + "<img src=" + image + ">" + "<\/td>";
    strVar += "    <td valign=\"top\">";
    strVar += "    <b>" + "English:  " + "<\/b>" + englishTitle + "<br>";
    strVar += "    <b>" + "Synonyms: " + "<\/b>" + synonyms + "<br>";
    strVar += "    <b>" + "Status:   " + "<\/b>" + status + "<br>";
    strVar += "    <b>" + "Episodes: " + "<\/b>" + episodes + "<br>";
    strVar += "    <b>" + "Score:    " + "<\/b>" + score + "<br>" + "<br>";
    strVar += "    <b>" + "Start-date: " + "<\/b>" + startDate + "<br>";
    strVar += "    <b>" + "End-date:   " + "<\/b>" + endDate + "<br>" + "<br>" + synopsis;
    strVar += "    <\/td>";
    strVar += "  <\/tr>";
    strVar += "<\/table>";
    strVar += "<\/body>";
        
    return strVar;
}