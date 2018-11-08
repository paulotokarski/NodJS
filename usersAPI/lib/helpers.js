 /*
 *
 * Helpers
 *
 */
// Dependencias
const crypto = require('crypto'); 
const config = require('./config'); 

// Container para os helpers
const helpers = { };

// Criptografar com SHA256
helpers.hash = function(str) {
	if (typeof(str) == 'string' && str.trim().length > 0) {
		var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hax');
		return hash;
	} else {
		return false;
	}
};

// Parse de um JSON para objeto
helpers.parseJsonToObject = function(str) {
	try {
		var obj = JSON.parse(str);
		return obj;
	} catch(e) {
		return { };
	}
}

module.exports = helpers;
