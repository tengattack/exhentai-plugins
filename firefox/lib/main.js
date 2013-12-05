//sdk requirements
	var pageMod = require("sdk/page-mod");
	var store = require("sdk/simple-storage");
	var request = require("sdk/request").Request;
	var notify = require("sdk/notifications");	
	var widgets = require("sdk/widget");
	var tabs = require("sdk/tabs");
	var data = require("sdk/self").data;
	var self = this;	

//main
exports.main = function() {

	/* going to add a widget, its not needed atm though
	var widget = widgets.Widget({
		id: "haruhichan-link",
		label: "haruhichan website",
		contentURL: self.data.url("sad.ico"),
		onClick: function() {
			tabs.open("http://haruhichan.com/");
	  	}
	});
	*/

	pageMod.PageMod({
		include: "http://exhentai.org*",
		contentScriptWhen: "end",
		contentScriptFile: [self.data.url("redirect.js")]
	});

    	pageMod.PageMod({
		include: "http://exhentai.org/login",
		contentScriptWhen: "end",
		contentScriptFile: [self.data.url("jquery.js"), self.data.url("exhentai.js")],
		onAttach: function(worker) {
	
		// Username Save Stuff
		worker.port.on('giveUsername', function(payload) {worker.port.emit('obtainUsername', store.storage.username);});
		worker.port.on('givePassword', function(payload) {worker.port.emit('obtainPassword', store.storage.password);});
		worker.port.on('saveUsername', function(payload) {store.storage.username = payload;});
		worker.port.on('savePassword', function(payload) {store.storage.password = payload;});
		worker.port.on('deleteLogin', function(payload) {	
			delete store.storage.username;
			delete store.storage.password;
		});

		worker.port.on('loginToEH', function(payload) {
			request({
                    		url: 'https://forums.e-hentai.org/index.php?act=Login&CODE=01',
                    		content: {
                        		'referer':'https://forums.e-hentai.org/index.php',
                        		'UserName':payload.username,
                       	 	'PassWord':payload.password,
                        		'CookieDate':'1'
                    		},
                    		onComplete: function(r) {
                        	worker.port.emit('loginToEHResult', {text:r.text, statusText:r.statusText, headers:r.headers});
				}
			}).post();
		});
        	}
	});

};