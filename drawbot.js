var config = {
	channels: ["#sketchdaily"],
	server: "irc.freenode.net",
	botName: "Drawbot2",
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
  host     : 'mysql.newfrost.com',
  user     : 'drawbot',
  password : 'rspj2005',
});

// random commands
bot.addListener("message", function(from, to, text, message) {
	try
	{
		if(GetParameter(text, 0) == "!say")
			PerformSay(text);
		else if(GetParameter(text, 0) == "!join")
			PerformJoin(text, message);
		else if(GetParameter(text, 0) == "!quit")
			PerformQuit(message);
		else if(GetParameter(text, 0) == "!timer")
			PerformTimer(to, text);
		else if(GetParameter(text, 0) == "!theme")
			PerformTheme(to, text);
		else if(GetParameter(text, 0) == "!participants")
			PerformParticipants(to, text);
		else if(GetParameter(text, 0) == "!start")
			PerformStart(to, text);
		else if(GetParameter(text, 0) == "!stop")
			PerformStop(to, text);
		else if(GetParameter(text, 0) == "!partyhard")
			PerformPartyHard(to, text);
		else if(GetParameter(text, 0) == "!pandahard")
			PerformPandaHard(to, text);
		else if(GetParameter(text, 0) == "!addreference")
			PerformAddReference(from, to, text);
		else if(GetParameter(text, 0) == "!reference")
			PerformReference(to, text);
		else if(GetParameter(text, 0) == "!deletereference")
			PerformDeleteReference(to, text);
	}
	catch(error)
	{
		bot.say(to, "Invalid command.");
	}
});

bot.addListener("message#", function(from, channel, text, message) {
	if(GetParameter(text, 0) == "!part")
		PerformPart(channel, text, message);
});

String.prototype.startsWith = function(needle)
{
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
	if(time == "")
		bot.say(channel, "Timer is " + Timer + " minutes.");
	else {
		if(isNaN(time))
			bot.say(channel, "lrn2number noob. example: !timer 5");
		else if(time <= 0)
			bot.say(channel, "Time must be greater than 0.");
		else if(time > 1000)
			bot.say(channel, "It's too big!!! (that's what she said).");
		else {
			Timer = time;
			bot.say(channel, "Timer set to " + Timer + " minutes.");
		}
	}
}

function PerformTheme(channel, text) {
	var theme = GetAllParameters(text, 1);
	if(theme == "")
		bot.say(channel, "Theme is \" " + Theme + " \".");
	else {
		Theme = theme;
		bot.say(channel, "Theme set to \" " + Theme + " \".");
	}
}

function PerformParticipants(channel, text) {
	var participants = GetAllParameters(text, 1);
	if(participants == "")
		bot.say(channel, "Participants: " + Participants);
	else {
		Participants = participants;
		bot.say(channel, "Participants: " + Participants);
	}
}

function PerformStart(channel, text) {
	if(Theme == "")
		bot.say(channel, "Theme must be set. ex: !theme something");
	else if(Participants == "")
		bot.say(channel, "Participants must be set. ex: !participants name1 name2 name3");
	else {
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
	if(TimerId == "")
		bot.say(channel, "Nothing to stop (except hammer time)");
	else {
		clearTimeout(TimerId);
		bot.say(channel, "The party has been pooped on. " + Participants);
		TimerId = "";
	}
}

function PerformPartyHard(channel) {
	var musicNotes = "\u266A \u266A \u266A"; // to get these codes, open charmap then scroll down a ways. the ascii value is shown at the bottom.
	bot.say(channel, musicNotes + " WUB WUB WUB " + musicNotes);
}

function PerformPandaHard(channel) {
	bot.say(channel, "No. Panda has been bad.");
}

function PerformReference(channel, text) {
	var tag = GetParameter(text, 1);
	db.query("CALL drawbot.getReference('" + tag + "');", function(err, rows, fields) { 
			if (err) 
				bot.say(channel, "DB Error."); 
			else if(rows.length > 0)
				if(rows[0].length > 0)
					bot.say(channel, "(" + rows[0][0].Id + ") " + rows[0][0].Link + " [" + rows[0][0].Tags + "] - added by " + rows[0][0].AddedBy + "."); 
		});
	
	// example:
	// !reference - gets random reference image
	// !reference 4 - gets reference image with id 4
	// !reference rat - gets a reference image tagged with rat	
	//    output: (3) http://www.imgur.com/whatever.jpg [rat, hairy]
}

function PerformAddReference(from, channel, text) {
	var imageLink = GetParameter(text, 1);
	var addedBy = from;
	var tags = GetAllParameters(text, 2);

	if(imageLink == "")
		bot.say(channel, "image link required. ex: !addreference http://www.something.com/test.jpg amazing, awesome, super cool");
	else if(tags == "")
		bot.say(channel, "tag required. ex: !addreference http://www.something.com/test.jpg amazing, awesome, super cool");
	else {
		//db.connect();
		db.query("CALL drawbot.insertReference('" + imageLink + "', '" + tags + "', '" + addedBy + "');", function(err, rows, fields) { 
				if (err) 
					bot.say(channel, "DB Error."); 
				else
					bot.say(channel, "Reference added."); // TO DO - include the id
			});
		//db.end();
	}
}

function PerformDeleteReference(channel, text) {
	// example:
	// !deletereference 3
	//    output: Deleted (3) http://www.imgur.com/whatever.jpg [rat, hairy]
	
	var id = GetParameter(text, 1);
	if(id == "")
		bot.say("Must provide id. ex: !deletereference 1");
	else 
		db.query("CALL drawbot.deleteReference('" + id + "');", function(err, rows, fields) { 
				if (err) 
					bot.say(channel, "DB Error."); 
				else
					bot.say(channel, "Deleted reference."); // TO DO - show what was deleted first
			});
}

function PerformQuote(channel, text) {
	// example:
	// !quote - random quote
	// !quote rat - random quote with rat in it somewhere
	// !quote keyword 4 - 4th quote with rat in it
}

function PerformAddQuote(channel, text) {
	// example:
	// !addquote <davidwinters> derp
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