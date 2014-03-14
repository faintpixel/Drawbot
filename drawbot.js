var config = {
	channels: ["#sketchdaily"],
	server: "irc.freenode.net",
	botName: "cindy14",
	autoRejoin: true,
    autoConnect: true,
	floodProtection: true,
    floodProtectionDelay: 1000,
	debug: true
};

var irc = require("irc");
var bot = new irc.Client(config.server, config.botName, {
  channels: config.channels
});

var mysql = require('mysql');
var db = mysql.createConnection({
  host     : 'lol',
  user     : 'lol',
  password : 'lol',
});

var log4js = require('log4js'); 
log4js.configure({
  appenders: [{ 
	type: 'file', 
	absolute: true,
	filename: 'skd.log', 
	maxLogSize: 524288000,
	category: 'plain-logs' 
  }]
});
var logger = log4js.getLogger('plain-logs');

var lastSeen = [];

// random commands
bot.addListener("message", function(from, to, text, message) {
	try {
		if(CommandFromBannedUser(message) == false) {
			var firstWord = GetParameter(text, 0);
			
			if(firstWord == "!say")
				PerformSay(text);
			else if(firstWord == "!join")
				PerformJoin(text, message);
			else if(firstWord == "!quit")
				PerformQuit(message);
			else if(firstWord == "!timer")
				PerformTimer(to, text);
			else if(firstWord == "!theme")
				PerformTheme(to, text);
			else if(firstWord == "!participants")
				PerformParticipants(to, text);
			else if(firstWord == "!start")
				PerformStart(to, text);
			else if(firstWord == "!stop")
				PerformStop(to, text);
			else if(firstWord == "!partyhard")
				PerformPartyHard(to, text);
			else if(firstWord == "!pandahard")
				PerformPandaHard(to, text);
			else if(firstWord == "!addreference")
				PerformAddReference(from, to, text);
			else if(firstWord == "!reference")
				PerformReference(to, text);
			else if(firstWord == "!deletereference")
				PerformDeleteReference(to, text);			
			else if(firstWord == "!addlol")
				PerformAddLOL(from, to, text);
			else if(firstWord == "!lol")
				PerformLOL(to, text);
			else if(firstWord == "!addface")
				PerformAddFace(from, to, text);
			else if(firstWord == "!face")
				PerformFace(to, text);
			else if(firstWord == "!deletelol")
				PerformDeleteLOL(to, text);
			else if(firstWord == "!deleteface")
				PerformDeleteFace(to, text);
			else if(firstWord == "!stats")
				PerformStats(to, text);
			else if(firstWord == "!lastseen" ) 
				PerformLastSeen(to,text);
		}
	} catch(error) {
		bot.say(to, "Invalid command." + error.message);
	}
});

bot.addListener('error', function(message) {
	var timestamp = GetTimestamp();
    logger.info('irc error: ', message);
    bot.say(config.channels[0],'3=D');
});

bot.addListener("topic", function(channel, topic, nick, message) {
	var timestamp = GetTimestamp();
	logger.info("* " + nick + " changes topic to '" + topic + "'");
});

bot.addListener("join", function(channel, nick, message) {
	var timestamp = GetTimestamp();
	registerLastSeen(nick, "* Joins: " + nick + " (" + message.prefix + ")" );
	logger.info("* Joins: " + nick + " (" + message.prefix + ")");
});

bot.addListener("part", function(channel, nick, reason, message) {
	var timestamp = GetTimestamp();
	logger.info("* Parts: " + nick + " (" + message.prefix + ")");
});

bot.addListener("quit", function(nick, reason, channels, message) {
	var timestamp = GetTimestamp();
	logger.info("* Quits: " + nick + " (" + message.prefix + ") (Quit: " + reason + ")");
});

bot.addListener("kick", function(channel, nick, by, reason, channels, message) {
	var timestamp = GetTimestamp();
	logger.info("* " + nick + " was kicked by " + by + " (" + reason + ")");
});

bot.addListener("nick", function(oldnick, newnick, channels, message) {
	var timestamp = GetTimestamp();
	logger.info("* " + oldnick + " is now known as " + newnick);
});

bot.addListener("message#", function(from, channel, text, message) {
	var timestamp = GetTimestamp();
	logger.info("<" + from + "> " + text);
	registerLastSeen(from, "<" + from + "> " + text);
	if(GetParameter(text, 0) == "!part")
		PerformPart(channel, text, message);
});

function GetTimestamp() {
	var now = new Date();
	var timestamp = now.toISOString();
	
	return timestamp;
}

String.prototype.startsWith = function(needle) {
    return(this.indexOf(needle) == 0);
};

function GetParameter(text, index) {
	var splitText = text.split(" ");
	if(splitText.length > index)
		return splitText[index];
	return "";
}

function GetAllParameters(text, index) {
	var result = "";
	var splitText = text.split(" ");
	if(splitText.length > index) {
		for(var i = index; i < splitText.length; i++) {
			if(result != "")
				result = result + " ";
			result = result + splitText[i];
		}
	}
	return result;
}

function PerformSay(text) {
	splitText = text.split(" ");
	if (splitText.length >= 3) {
		if(splitText[1].startsWith("#")) {
			var channel = splitText[1];
			var message = GetAllParameters(text, 2);
			bot.say(channel, message);
		}
	}
}

function CommandFromAdmin(message) {
	if(message.host.indexOf("cg.shawcable.net") > -1)
		return true;
	else
		return false;
}

function CommandFromBannedUser(message) {
	return false;
	if(message.prefix.toLowerCase().indexOf("panda") != -1)
		return true;
	else
		return false;
}

function PerformJoin(text, message) {
	if(CommandFromAdmin(message)) {
		var channelToJoin = GetParameter(text, 1);
		if(channelToJoin.startsWith("#"))
			bot.join(channelToJoin);
	}
}

function PerformPart(channel, text, message) {
	if(CommandFromAdmin(message)) {
		var channelToPart = GetParameter(text, 1);
		if(channelToPart == "")
			bot.part(channel);
		else
			bot.part(channelToPart);
	}
}

function PerformQuit(message) {
	if(CommandFromAdmin(message)) {
		bot.disconnect();
		db.destroy();
		node.exit();
	}
}


// Drawing stuff
var Timer = 5;
var Participants = "";
var Theme = "the spanish inquisition";
var TimerId = "";

function PerformTimer(channel, text) {
	var time = GetParameter(text, 1);
	if(time == "") {
		bot.say(channel, "Timer is " + Timer + " minutes.");
	} else {
		if(isNaN(time)) {
			bot.say(channel, "lrn2number noob. example: !timer 5");
		} else if(time <= 0) {
			bot.say(channel, "Time must be greater than 0.");
		} else if(time > 1000) {
			bot.say(channel, "It's too big!!! (that's what she said).");
		} else {
			Timer = time;
			bot.say(channel, "Timer set to " + Timer + " minutes.");
		}
	}
}

function PerformTheme(channel, text) {
	var theme = GetAllParameters(text, 1);
	if(theme == "") {
		bot.say(channel, "Theme is \" " + Theme + " \".");
	} else {
		Theme = theme;
		bot.say(channel, "Theme set to \" " + Theme + " \".");
	}
}

function PerformParticipants(channel, text) {
	var participants = GetAllParameters(text, 1);
	if(participants == "") {
		bot.say(channel, "Participants: " + Participants);
	} else {
		Participants = participants;
		bot.say(channel, "Participants: " + Participants);
	}
}

function PerformStart(channel, text) {
	if(Theme == "") {
		bot.say(channel, "Theme must be set. ex: !theme something");
	} else if(Participants == "") {
		bot.say(channel, "Participants must be set. ex: !participants name1 name2 name3");
	} else if( TimerId != "" ) { // try and prevent multiple rounds
		bot.say(channel, "A round has already started");
	} else {
		var checkeredFlag = "\u2584\u2580\u2584\u2580\u2584\u2580\u2584\u2580\u2584\u2580";
		var timeUp = (Number(Timer) * 60 * 1000) + 8000; // add 8 seconds to the timer since we have the countdown
		bot.say(channel, checkeredFlag + " NEW ROUND IS ABOUT TO START! " + checkeredFlag);
		bot.say(channel, "You have " + Timer + " minutes to draw \" " + Theme + " \".");
		setTimeout(function() { bot.say(channel, "3"); }, 2000);
		setTimeout(function() { bot.say(channel, "2"); }, 4000);
		setTimeout(function() { bot.say(channel, "1"); }, 6000);
		setTimeout(function() { bot.say(channel, "GO!"); }, 8000);
		TimerId = setTimeout(function() { bot.say(channel, "PENCILS DOWN! " + Participants); }, timeUp);
	}
}

function PerformStop(channel, text) {
	if(TimerId == "") {
		bot.say(channel, "Nothing to stop (except hammer time)");
	} else {
		clearTimeout(TimerId);
		bot.say(channel, "The party has been pooped on. " + Participants);
		TimerId = "";
	}
}

function PerformStats(channel, text) {
	bot.say(channel, "http://stats.sketchdaily.net/IRC/sketchdaily.html");
}

function PerformPartyHard(channel) {
	var musicNotes = "\u266A \u266A \u266A"; // to get these codes, open charmap then scroll down a ways. the ascii value is shown at the bottom.
	bot.say(channel, musicNotes + " WUB WUB WUB " + musicNotes);
}

function PerformPandaHard(channel) {
	bot.say(channel, "No. Panda has been bad.");
}

function PerformReference(channel, text) {
	var tag = GetParameter(text, 1); // TO DO - if is number, get by id instead
	db.query("CALL drawbot.getReference('" + tag + "');", function(err, rows, fields) { 
			if (err) {
				bot.say(channel, "DB Error."); 
			} else if(rows.length > 0) {
				if(rows[0].length > 0)
					bot.say(channel, "(" + rows[0][0].Id + ") " + rows[0][0].Link + " [" + rows[0][0].Tags + "]."); 
				else
					bot.say(channel, "Nothing found.");
			} else {
				bot.say(channel, "Nothing found."); 
			}
		});
}

function PerformLOL(channel, text) {
	var tag = GetParameter(text, 1); // TO DO - if is number, get by id instead
	db.query("CALL drawbot.getLOL('" + tag + "');", function(err, rows, fields) { 
			if (err) {
				bot.say(channel, "DB Error."); 
			} else if(rows.length > 0) {
				if(rows[0].length > 0)
					bot.say(channel, "(" + rows[0][0].id + ") " + rows[0][0].funny); 
				else
					bot.say(channel, "Nothing found. lol :(");
			} else {
				bot.say(channel, "Nothing found. lol :("); 
			}
		});
}
function PerformFace(channel, text) {
	var tag = GetParameter(text, 1); // TO DO - if is number, get by id instead
	db.query("CALL drawbot.getFACE('" + tag + "');", function(err, rows, fields) { 
			if (err) {
				bot.say(channel, "DB Error."); 
			} else if(rows.length > 0) {
				if(rows[0].length > 0)
					bot.say(channel, "(" + rows[0][0].id + ") " + rows[0][0].funny); 
				else
					bot.say(channel, "Nothing found. :(");
			} else {
				bot.say(channel, "Nothing found. :("); 
			}
		});
}

function PerformAddReference(from, channel, text) {
	var imageLink = GetParameter(text, 1);
	var addedBy = from;
	var tags = GetAllParameters(text, 2);

	if(imageLink == "") {
		bot.say(channel, "image link required. ex: !addreference http://www.something.com/test.jpg amazing, awesome, super cool");
	} else if(tags == "") {
		bot.say(channel, "tag required. ex: !addreference http://www.something.com/test.jpg amazing, awesome, super cool");
	} else {
		db.query("CALL drawbot.insertReference('" + imageLink + "', '" + tags + "', '" + addedBy + "');", function(err, rows, fields) { 
				if (err) 
					bot.say(channel, "DB Error."); 
				else
					bot.say(channel, "Reference added."); // TO DO - include the id
			});
	}
}

function PerformAddLOL(from, channel, text) {
	var funny = GetAllParameters(text, 1);
	var addedBy = from;

	if(funny == "") {
		bot.say(channel, "that's not funny. ex: !addlol <Dodongo> I'm so tall!");
	} else {
		db.query("CALL drawbot.insertLOL('" + funny + "', '" + addedBy + "');", function(err, rows, fields) { 
				if (err) 
					bot.say(channel, "DB Error."); 
				else
					bot.say(channel, "lol!!"); // TO DO - include the id
			});
	}
}

function PerformAddFace(from, channel, text) {
	var funny = GetAllParameters(text, 1);
	var addedBy = from;

	if(funny == "")
		bot.say(channel, "that's not a face. ex: !addface (`3`) kiss");
	else {
		db.query("CALL drawbot.insertFace('" + funny + "', '" + addedBy + "');", function(err, rows, fields) { 
				if (err) 
					bot.say(channel, "DB Error."); 
				else
					bot.say(channel, "so cute!!"); // TO DO - include the id
			});
	}
}

function PerformDeleteReference(channel, text) {
	var id = GetParameter(text, 1);
	if(id == "") {
		bot.say("Must provide id. ex: !deletereference 1");
	} else {
		db.query("CALL drawbot.deleteReference('" + id + "');", function(err, rows, fields) { 
				if (err) 
					bot.say(channel, "DB Error."); 
				else
					bot.say(channel, "Deleted reference."); // TO DO - show what was deleted first: Deleted (3) http://www.imgur.com/whatever.jpg [rat, hairy]
			});
	}
}

function PerformDeleteLOL(channel, text) {
	var id = GetParameter(text, 1);
	if(id == "") {
		bot.say("Must provide id. ex: !deletelol 1");
	} else {
		db.query("CALL drawbot.deleteLOL('" + id + "');", function(err, rows, fields) { 
				if (err) 
					bot.say(channel, "DB Error."); 
				else
					bot.say(channel, "Deleted, lol."); // TO DO - show what was deleted first
			});
	}
}
function PerformDeleteFace(channel, text) {
	var id = GetParameter(text, 1);
	if(id == "") {
		bot.say("Must provide id. ex: !deleteface 1");
	} else {
		db.query("CALL drawbot.deleteFace('" + id + "');", function(err, rows, fields) { 
				if (err) 
					bot.say(channel, "DB Error."); 
				else
					bot.say(channel, "Deleted, :<"); // TO DO - show what was deleted first
			});
	}
}

function PerformLastSeen(channel, text) {
	var who = GetParameter(text, 1);
	if( typeof lastSeen[who.toLower()] == 'undefined' ) 
		bot.say(channel, "couldn't find "+who);
	else bot.say( channel, lastSeen[who.toLower()] );
}

function registerLastSeen(who, text) {
	var timestamp = GetTimestamp();
	lastSeen[who.toLower()] = timestamp + " " + text;
}

function PerformSuggestTheme(channel, text) {
	// example:
	// !suggesttheme Ponies
}

function PerformRandomTheme(channel, text) {
	// example:
	// !randomtheme
	//    output: (4) Ponies [Artomizer]
}