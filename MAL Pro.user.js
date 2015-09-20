// ==UserScript==
// @name         MAL Extra
// @version      1.0.4
// @description  Show anime info in your animelist
// @author       Cpt_mathix
// @match        *://myanimelist.net/animelist/*
// @grant        none
// @namespace https://greasyfork.org/users/16080
// ==/UserScript==

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

function getAnimeInfo(animetitle, animeid) {
    // your login
    var username = " ";
    var password = " ";

    // API request
    var anime = animetitle.replace(/ /g, "_");
    var xhr = new XMLHttpRequest();
    var url = "http://" + username + ":" + password + "@myanimelist.net/api/anime/search.xml?q=" + anime;
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
    // your login
    var username = " ";
    
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
                    table.innerHTML = "There seems to be an error... Sorry <br> I know that some animetitles do not work and will try to fix this in the future <br> Broken titles: Gintama, Kingdom, Tokyo Ghoul, Tokyo Ghoul √A, Shiki"
                }
                if (entry1 == "401") {
                    table.innerHTML = "Your login is wrong, please check if your username and password are correct in the script-code <br> If it worked before, I probably updated the script and you need to re-enter your login in the script"
                }
                table.innerHTML = displayAnimeInfo(entry1, entry2);;
            }
        }, "json");
    };
}

function displayAnimeInfo(entry1, entry2) {
    var englishTitle = "English: " + entry1.getElementsByTagName('english')[0].textContent;
    if (englishTitle == "English: ") {
        englishTitle = "English: " + entry1.getElementsByTagName('title')[0].textContent;
    }
    
    var synonyms = "Synonyms: " + entry1.getElementsByTagName('synonyms')[0].textContent;
    var episodes = "Episodes: " + entry1.getElementsByTagName('episodes')[0].textContent;
    if (episodes == "Episodes: 0") {
        episodes = "Episodes: unknown";                
    }
    
    var score = "Score: " + entry1.getElementsByTagName('score')[0].textContent;
    var startDate = "Start Date: " + entry1.getElementsByTagName('start_date')[0].textContent.replace(/\d\d\d\d-\d\d-\d\d/g, function(s) {    
        var dmy = s.split('-');    
        return dmy[2] + '/' + dmy[1] + '/' + dmy[0];    
    });
    
    var endDate = "End Date: " + entry1.getElementsByTagName('end_date')[0].textContent.replace(/\d\d\d\d-\d\d-\d\d/g, function(s) {    
        var dmy = s.split('-');    
        return dmy[2] + '/' + dmy[1] + '/' + dmy[0];    
    });
    if (endDate == "End Date: 00/00/0000") {
        endDate = "End Date: unknown";
    }
    
    var status = "Status: " + entry1.getElementsByTagName('status')[0].textContent;
    var synopsis = entry1.getElementsByTagName('synopsis')[0].textContent;
    var image = entry1.getElementsByTagName('image')[0].textContent;
    
    var strVar="";
    strVar += "<body>";
    strVar += "<table>";
    strVar += "  <tr>";
    strVar += "    <td>" + "<img src=" + image + ">" + "<\/td>";
    strVar += "    <td valign=\"top\">" + englishTitle + "<br>" + synonyms + "<br>" + status + "<br>" + episodes + "<br>" + score + "<br>" + startDate + "<br>" + endDate + "<br>" + "<br>" + synopsis + "<\/td>";
    strVar += "  <\/tr>";
    strVar += "<\/table>";
    strVar += "<\/body>";
        
    return strVar;
}