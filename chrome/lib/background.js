function setHentaiCookies() {
	try {
		chrome.cookies.getAll({domain:'.e-hentai.org'}, function(got) {
			for(var i = 0; i < got.length; i++) {
				if(got[i].name.indexOf('ipb_') != -1 || got[i].name.indexOf('uconfig') != -1) {
					chrome.cookies.set({url:'http://exhentai.org/', domain:'.exhentai.org', name:got[i].name, path:'/', value:got[i].value});
				}
			}
		});
			
		return true;
	} catch(e) {
		return false;
	}
}

function parseLoginForm(data) {
	if (data.indexOf('Logged in as:') !== -1) {
		return {islogin: true};
	}
	var mform = data.match(/(<form action="(.+?)"[^]*<\/form>)/i);
	if (mform) {
		var inputPattern = /<input type="hidden" name="(.+?)" value="(.+?)" \/>/ig;
		var sform = mform[1];
		var surl = mform[2];
		var reqparas = '';
		while (match = inputPattern.exec(sform)) {
		  reqparas += match[1] + '=' + encodeURIComponent(match[2]) + '&';
		}
		return {
			action: surl,
			paras: reqparas
		};
	}
	return null;
}

function loadLoginForm(callback) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (this.readyState == this.DONE) {
	    if (this.status == 200) {
	    	callback(parseLoginForm(this.responseText));
	    	return;
	    }
	    callback(null);
	  }
	};
	xhr.open("GET", "https://forums.e-hentai.org/index.php?act=Login&CODE=01");
	xhr.send();
}

function loginHentai(username, password, tab_id) {
	function callback(data) {
		chrome.tabs.sendMessage(tab_id, {action: 'login', data: data});
	}
	loadLoginForm(function (form) {
		if (!form) {
			callback(null);
			return;
		} else if (form.islogin) {
			callback(true);
			return;
		}

		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
		  if (this.readyState == this.DONE) {
		    if (this.status == 200) {
		      callback(this.responseText);
		      return;
		    }
		    // something went wrong
		    callback(null);
		  }
		};
		xhr.open("POST", form.action);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		//xhr.setRequestHeader("Referer", "https://forums.e-hentai.org/index.php");
		var data = form.paras + 'UserName=' + username + '&PassWord=' + password;
		xhr.send(data);
	});
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request == 'cookieDataSet') {
		sendResponse((setHentaiCookies() ? 'ok' : 'Unable to set cookies'));
	} else if(typeof(request) == 'object') {
		if (request && request.action) {
			switch (request.action) {
				case 'login':
					loginHentai(request.username, request.password, sender.tab.id);
					break;
			}
		}
	} else if(request == 'deleteAllCookies') {
		chrome.cookies.remove({name:"yay", url:"http://exhentai.org/"}, function(){});
		chrome.cookies.remove({name:"ipb_anonlogin", url:"http://exhentai.org/"}, function(){});
		chrome.cookies.remove({name:"ipb_member_id", url:"http://exhentai.org/"}, function(){});
		chrome.cookies.remove({name:"ipb_pass_hash", url:"http://exhentai.org/"}, function(){});
		chrome.cookies.remove({name:"ipb_session_id", url:"http://exhentai.org/"}, function(){});
		chrome.cookies.remove({name:"ipb_anonlogin", url:"http://e-hentai.org/"}, function(){});
		chrome.cookies.remove({name:"ipb_member_id", url:"http://e-hentai.org/"}, function(){});
		chrome.cookies.remove({name:"ipb_pass_hash", url:"http://e-hentai.org/"}, function(){});
		chrome.cookies.remove({name:"ipb_session_id", url:"http://e-hentai.org/"}, function(){});		
		sendResponse();
	} else if(request == 'reload') {
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.reload(tab.id);
		});
	}
});