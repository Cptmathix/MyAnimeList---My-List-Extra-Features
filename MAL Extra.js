// ==UserScript==
// @name         MyAnimeList(MAL) - Extra
// @version      5.0.4
// @description  Show anime/manga info inside your animelist/mangalist
// @author       Cpt_mathix
// @match        *://myanimelist.net/animelist/*
// @match        *://myanimelist.net/mangalist/*
// @license      GPL version 2 or any later version; http://www.gnu.org/licenses/gpl-2.0.txt
// @namespace https://greasyfork.org/users/16080
// ==/UserScript==

(function($) {
	var store = (function() {
		var map = {};

		return {
			set: function (name, value) {
				map[name] = value;
			},
			get: function (name) {
				return map[name];
			}
		};
	})();

	var mal = {
		href: document.location.href,
		modern: false,
		user: '',
		type: [],
		xmlDoc: undefined
	};

	init();

	function init() {
		mal.user = mal.href.match(/[^/]*?(?=\?|$)/)[0];

		if(mal.href.indexOf("mangalist") > -1) {
			mal.type = ["manga",65];
		} else {
			mal.type = ["anime",64];
		}

		mal.modern = $('.header .header-menu .btn-menu > .username').length > 0;
		console.log(mal.modern);

		if (mal.modern) {
			initModernList();
		} else {
			initOldList();
		}
	}

	function initOldList() {
		$('#list_surround > table > tbody > tr > td[class*=td]:nth-child(2)').each( function() {
			var id = $(this).find('> a').attr('href').match(/\/(\d+)\//)[1];
			var tdtype = $(this).attr('class').match(/\d/)[0];
			var moreEl = $(this).find('> div > small > a:nth-child(2)');
			var memberId = $('#listUserId').val();
			var moreObject = $("#more" + id);

			$(moreEl).removeAttr('onclick');
			$(moreEl).on('click', displayTable(id, tdtype, moreObject, memberId));
		});
	}

	function initModernList() {
		$('#list-container > div.list-block > div > table > tbody[class=list-item] > tr.list-table-data > td.data.title').each( function() {
			var id = $(this).find('> a').attr('href').match(/\/(\d+)\//)[1];
			var moreEl = $(this).find('> div > span.more > a');
			var memberId = $('body')[0].dataset.ownerId;
			var moreObject = $("#more-" + id);

			var el = $(moreEl)[0],
				elClone = el.cloneNode(true);
			el.parentNode.replaceChild(elClone, el);
			$(elClone).on('click', displayTable(id, 1, moreObject, memberId));
		});
	}

	//--------------------------------//
	//       Get Data Functions       //
	//--------------------------------//

	function getAnimeInfo(animeid, table) {

		if (mal.xmlDoc === undefined) {
			mal.xmlDoc = getUserListInfo();
		}

		var dataMap = store.get(animeid + 'MAP');
		var dataArray = store.get(animeid + 'Array');

		$.get('/' + mal.type[0] + '/' + animeid, function(data) {
			$(data).find('#content > table > tbody > tr > td.borderClass > div > div:nth-child(n) > span').each(function() {
				var item = this.textContent.replace(/:/g,"");
				if (isNaN(item) && (this.nextElementSibling === null || item == "Ranked")) {
					dataMap.push(item);
					dataArray.push(this.nextSibling.textContent);
				} else if (isNaN(item) && item.indexOf(',') == -1) {
					dataMap.push(item);
					var information = this.parentNode.children[1].outerHTML;
					for(var i = 2; i < this.parentNode.children.length && item != "Score"; i++) {
						information += ", " + this.parentNode.children[i].outerHTML;
					}
					dataArray.push(information);
				}
			});
			$(data).find('#content > table > tbody > tr > td:nth-child(2) > div > table > tbody > tr:nth-child(1) > td > span').each(function() {
				dataMap.push('Synopsis');
				dataArray.push(this.innerHTML);
			});
			$(data).find('#content > table > tbody > tr > td:nth-child(2) > div > table > tbody > tr:nth-child(2) > td > table.anime_detail_related_anime > tbody > tr:nth-child(n) > td.ar.fw-n.borderClass').each(function() {
				var related = this.textContent.replace(/:/g,"");
				if (related == "Parent story") {
					dataMap.push('Parent');
					dataArray.push(this.nextElementSibling.innerHTML);
				} else if (related == "Side story" && this.nextElementSibling.children.length <= 3) {
					dataMap.push('Side');
					dataArray.push(this.nextElementSibling.innerHTML);
				} else if (related == "Prequel") {
					dataMap.push('Prequel');
					dataArray.push(this.nextElementSibling.innerHTML);
				} else if (related == "Sequel") {
					dataMap.push('Sequel');
					dataArray.push(this.nextElementSibling.innerHTML);
				} else if (related == "Alternative version") {
					dataMap.push('Alternative');
					dataArray.push(this.nextElementSibling.innerHTML);
				}
			});

			// score is a little bit different to get with manga -.-
			if (mal.type[0] == "manga") {
				$(data).find('#content > table > tbody > tr > td.borderClass > div > div:nth-child(n) > span > span:nth-child(2)').each(function() {
					dataMap.push('Score');
					dataArray.push(this.innerHTML);
				});
			}

			table.innerHTML = displayAnimeInfo(animeid);

			if (mal.modern) {
				$(table).find('a').each( function() {
					$(this).hover(function (){
						$(this).css("text-decoration", "underline");
					}, function() {
						$(this).css("text-decoration", "none");
					});
				});
			}

			var synopsis = table.getElementsByClassName('synopsis')[0];
			var image = table.getElementsByClassName('image')[0];
			var information = table.getElementsByClassName('information')[0];
			var related = table.getElementsByClassName('related')[0];

			image.firstChild.onload = function() {
				var synopsisHeight = this.height - related.offsetHeight - information.offsetHeight;
				synopsis.setAttribute('style', 'max-height:' + synopsisHeight + 'px; overflow:auto; overflow-y: auto;');
			};
		});
	}

	function getUserListInfo() {
		var xhr = new XMLHttpRequest();
		var url = '/malappinfo.php?u=' + mal.user + '&status=all&type=' + mal.type[0] + '';
		xhr.open("GET", url, false);
		xhr.setRequestHeader('Content-Type', 'text/xml');
		xhr.send();
		var xmlDocument = xhr.responseXML;
		return xmlDocument;
	}

	function getDataFromOriginalMore(preData, animeid) {
		var dataMap = store.get(animeid + 'MAP');
		var dataArray = store.get(animeid + 'Array');
		
		// Time Spent Watching
		var start = preData.indexOf('Time Spent Watching');
		var end = preData.indexOf('<small>(');
		dataMap.push('TimeSpentWatching');
		dataArray.push(preData.substring(start + 21, end));
		start = end;
		end = preData.indexOf('per episode');
		var episodeTime = preData.substring(start + 8, end);
		dataMap.push('EpisodeTime');
		dataArray.push(episodeTime);
	}

	//--------------------------------//
	//     Display Data Functions     //
	//--------------------------------//

	function displayTable(animeid, tdtype, moreObject, memberId) {
		return function () {

			if (moreObject.is(":visible")) {
				moreObject.hide();
			} else if (moreObject.hasClass("extraLoaded")) {
				moreObject.show();
			} else {
				$.post("/includes/ajax-no-auth.inc.php?t=6", {color:tdtype,id:animeid,memId:memberId,type:mal.type[0]}, function(data) {
					if (mal.modern)
						moreObject.find(".more-content").html(data.html);
					else
						moreObject.html(data.html);
					moreObject.show();
					moreObject.addClass("extraLoaded");

					var table = $(moreObject).find('.td' + tdtype + '.borderRBL')[0];
					var dataMap = [];
					var dataArray = [];
					store.set(animeid + 'MAP', dataMap);
					store.set(animeid + 'Array', dataArray);
					if (table !== null && mal.type[0] != "manga") {
						getDataFromOriginalMore(table.innerHTML, animeid);
						table.innerHTML = "Fetching data";
						getAnimeInfo(animeid, table);
					} else if (table !== null) {
						table.innerHTML = "Fetching data";
						getAnimeInfo(animeid, table);
					}
				},"json");
			}
		};
	}

	function getDataValue(animeid, string) {
		var dataMap = store.get(animeid + 'MAP');
		var dataArray = store.get(animeid + 'Array');

		var elementPos = dataMap.map(function(x) {return x; }).indexOf(string);
		if (dataArray[elementPos] === undefined)
			return "Unavailable";
		return dataArray[elementPos];
	}

	function getXmlEntry(animeid, string) {
		var entry = mal.xmlDoc.getElementsByTagName(mal.type[0]);
		var entryid = mal.xmlDoc.getElementsByTagName('series_' + mal.type[0] + 'db_id');
		for(var k = 0; k < entryid.length; k++) {
			if (entryid[k].textContent == animeid) {
				return entry[k].getElementsByTagName('series_' + string)[0].textContent;
			}
		}
	}

	function calcTimeNeeded(episodeTime, totalEpisodes) {
		if (totalEpisodes.trim() == "0" || totalEpisodes == "Unknown") {
			return 'Unknown';
		} else if (episodeTime.indexOf("0 hours, 0 minutes, and 0 seconds") > -1) {
			return 'Unknown';
		} else if (totalEpisodes.trim() == "1") {
			return episodeTime;
		} else {
			var str = episodeTime.split(' ');

			var totalSeconds = parseInt(str[5]) * totalEpisodes + (parseInt(str[2]) * totalEpisodes * 60) + (parseInt(str[0]) * totalEpisodes * 60 * 60);
			var seconds = totalSeconds % 60;
			var totalMinutes = Math.floor(totalSeconds/60);
			var minutes = totalMinutes % 60;
			var hours = Math.floor(totalMinutes/60);

			return hours + " hours, " + minutes + " minutes and " + seconds + " seconds";
		}
	}

	function displayAnimeInfo(animeid) {
		var dataMap = store.get(animeid + 'MAP');
		var dataArray = store.get(animeid + 'Array');

		var episodes = getDataValue(animeid, 'Episodes');
		var chapters = getDataValue(animeid, 'Chapters');
		var volumes = getDataValue(animeid, 'Volumes');
		var image = getXmlEntry(animeid, "image");
		var genres = getDataValue(animeid, 'Genres');
		var status = getDataValue(animeid, 'Status');
		var broadcast = getDataValue(animeid, 'Broadcast');
		var score = getDataValue(animeid, 'Score');
		var rank = getDataValue(animeid, 'Ranked').replace("#","");
		var popularity = getDataValue(animeid, 'Popularity').replace("#","");
		var studio = getDataValue(animeid, 'Studios');

		var parent = getDataValue(animeid, 'Parent');
		var side = getDataValue(animeid, 'Side');
		var prequel = getDataValue(animeid, 'Prequel');
		var sequel = getDataValue(animeid, 'Sequel');
		var alternative = getDataValue(animeid, 'Alternative');

		var synopsis = getDataValue(animeid, 'Synopsis').replace(/\(Source.*[\s\S]*/g,"").replace(/\[.*\]/g,"").replace(/(<br>|\s+)*$/,"");

		var timeSpentWatching;
		var timeNeeded;
		if (mal.type[0] == "anime") {
			timeSpentWatching = getDataValue(animeid, 'TimeSpentWatching').replace("tes,","tes");
			timeNeeded = '0';
			if (timeSpentWatching.indexOf("0 hours, 0 minutes and 0 seconds") > -1) {
				timeNeeded = calcTimeNeeded(getDataValue(animeid, 'EpisodeTime'), episodes);
			}
		}
		var startDate = getXmlEntry(animeid, 'start').replace(/\d\d\d\d-\d\d-\d\d/g, function(s) {
			var dmy = s.split('-');
			return dmy[2] + '/' + dmy[1] + '/' + dmy[0];
		});
		var endDate = "";
		if (startDate == "00/00/0000") {
			startDate = "N/A";
		} else {
			endDate = getXmlEntry(animeid, 'end').replace(/\d\d\d\d-\d\d-\d\d/g, function(s) {
				var dmy = s.split('-');
				return dmy[2] + '/' + dmy[1] + '/' + dmy[0];
			});
			if (episodes.trim() == "1") {
				endDate = "";
			} else if (endDate == "00/00/0000") {
				endDate = " " + "to N/A";
			} else {
				endDate = " to " + endDate;
			}
		}

		// console.log(dataMap);
		// console.log(dataArray);

		var strVar="";
		strVar += "<body>";
		strVar += "<table>";
		strVar += "  <tr>";
		strVar += "    <td class=\"image\" valign=\"top\" rowspan=\"4\">" + "<img src=" + image + ">" + "<\/td>";
		strVar += "    <td class=\"information\" valign=\"top\" width=\"35%\">";
		strVar += (status.indexOf("Currently Airing") > -1) ? ("<b>" + "Broadcast: " + "<\/b>" + broadcast + "<br>") : ("");
		strVar += (mal.type[0] == "anime") ? ("<b>" + "Episodes: " + "<\/b>" + episodes + "<br>") : ("<b>" + "Volumes: " + "<\/b>" + volumes + "<br>" + "<b>" + "Chapters: " + "<\/b>" + chapters + "<br>");
		strVar += "    <b>" + "Score: " + "<\/b>" + score + "<br>";
		strVar += "    <b>" + "Rank: " + "<\/b>" + rank + "<br>";
		strVar += "    <b>" + "Popularity: " + "<\/b>" + popularity + "<br>";
		strVar += (studio.indexOf("add some") == -1 && mal.type[0] != "manga") ? ("<b>" + "Studio: " + "<\/b>" + studio + "<br>") : ("");
		strVar += (mal.type[0] == "anime") ? ("<b>" + "Aired: " + "<\/b>" + startDate + endDate + "<br>") : ("<b>" + "Published: " + "<\/b>" + startDate + endDate + "<br>");
		strVar += "    <\/td>";
		strVar += "    <td class=\"genres\" valign=\"top\" align=\"right\" width=\"65%\">" + genres + "<\/td>";
		strVar += "  <\/tr>";
		strVar += "  <tr>";
		strVar += "    <td valign=\"top\" colspan=\"2\" width=\"100%\" height=\"100%\"><div class=\"synopsis\">" + "<br>" + synopsis + "<br><br>";
		strVar += "    <a href=\"/forum/?" + mal.type[0] + "id=" + animeid + "\" target=\"_blank\"><small>Discuss " + mal.type[0].charAt(0).toUpperCase() + mal.type[0].slice(1) + "</small></a></div><\/td>";
		strVar += "  <\/tr>";
		strVar += "  <tr>";
		strVar += "    <td class=\"related\" valign=\"bottom\" align=\"left\" height=\"5px\" width=\"50%\">";
		strVar += (parent != "Unavailable") ? ("<small>" + "<b>" + "Parent story: " + "<\/b>" + parent + "<\/small>") : ("");
		strVar += (side != "Unavailable") ? ("<br>" + "<small>" + "<b>" + "Side story: " + "<\/b>" + side + "<\/small>") : ("");
		strVar += (prequel != "Unavailable") ? ("<br>" + "<small>" + "<b>" + "Prequel: " + "<\/b>" + prequel + "<\/small>") : ("");
		strVar += (sequel != "Unavailable") ? ("<br>" + "<small>" + "<b>" + "Sequel: " + "<\/b>" + sequel + "<\/small>") : ("");
		strVar += (alternative != "Unavailable") ? ("<br>" + "<small>" + "<b>" + "Alternative version: " + "<\/b>" + alternative + "<\/small>") : ("");
		strVar += "    <\/td>";
		strVar += (mal.type[0] == "anime") ? ("<td class=\"timeNeeded\" valign=\"bottom\" align=\"right\" colspan=\"2\">" + "<br>" + "<small>" + (timeNeeded == '0' ? ("<b>" + "Time Spent Watching: " + "<\/b>" + timeSpentWatching) : ("<b>" + "Time To Complete: " + "<\/b>" + timeNeeded)) + "<\/small>" + "<\/td>") : ("");
		strVar += "  <\/tr>";
		strVar += "<\/table>";
		strVar += "<\/body>";

		return strVar;
	}
})(jQuery);
