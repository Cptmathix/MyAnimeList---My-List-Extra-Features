// ==UserScript==
// @name         MAL Pro
// @version      1.0.0
// @description  My Anime List Extra Features
// @author       Cpt_mathix
// @match        *://myanimelist.net/animelist/*
// @grant        none
// ==/UserScript==

var table = document.getElementById("list_surround").children;
for (var i = 0; i < table.length; i++) {
    var cell = table[i].getElementsByTagName('td');
    
    for (var j = 0; j < cell.length; j++) {
        
        // Displays Anime Info
        var hasMore = cell[j].innerHTML.search('More');
        if (hasMore != -1) {
            var animetitlelist = cell[j].getElementsByClassName('animetitle');
            
            // get animeid
            var a = cell[j].getElementsByTagName("a");
            var animeid = a[1].id.match(/\d/g).join("");
            
            // get table color type
            var tdtype = cell[j].className.match(/\d/g).join("");
            
            // replace onclick function with my own
            a[1].removeAttribute('onclick');
            a[1].addEventListener('click', getAnimeInfo(animetitlelist, animeid, tdtype) , true); 
        }
        
        // Not Yet Aired becomes transparant
        var found = cell[j].innerHTML.search('Not Yet Aired');
        if (found != -1) {
            cell[j].setAttribute('style', 'opacity:0.50 !important');
            // table[i].setAttribute('style', 'display:none !important');
        }
    }
}

function getAnimeInfo(animetitlelist, animeid, tdtype) {
    return function () {
        // your login
        var username = " ";
        var password = " ";
        
        // API request
        var animetitle = animetitlelist[0].innerText;
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
                    displayTable(animeid, entry[k], tdtype);
                }
            }
        }
    };
}

// if this fails to function, look at getExpand(arg1, arg2) function on the myanimelist page
function displayTable(animeid, entry, tdtype) {
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
        var hiddenbox = "more" + animeid;
        var table = document.getElementById(hiddenbox).getElementsByClassName('td' + tdtype + ' borderRBL')[0]
        if (table != null) {
            table.innerHTML = displayAnimeInfo(entry);;
        }
	}, "json");
}

function displayAnimeInfo(entry) {
    var englishTitle = "English: " + entry.getElementsByTagName('english')[0].textContent;
    if (englishTitle == "English: ") {
        englishTitle = "English: " + entry.getElementsByTagName('title')[0].textContent;
    }
    var episodes = "Episodes: " + entry.getElementsByTagName('episodes')[0].textContent;
    var score = "Score: " + entry.getElementsByTagName('score')[0].textContent;
    var synopsis = entry.getElementsByTagName('synopsis')[0].textContent;
    var image = entry.getElementsByTagName('image')[0].textContent;
    
    var strVar="";
    strVar += "<body>";
    strVar += "";
    strVar += "<table>";
    strVar += "  <tr>";
    strVar += "    <td>" + "<img src=" + image + ">" + "<\/td>";
    strVar += "    <td valign=\"top\">" + englishTitle + "<br>" + episodes + "<br>" + score + "<br>" + "<br>" + synopsis + "<\/td>";
    strVar += "  <\/tr>";
    strVar += "<\/table>";
    strVar += "<\/body>";
        
    return strVar;
}