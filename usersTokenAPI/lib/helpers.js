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
  if (typeof(str) == 'string' && str.length > 0) {
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
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

// Criar uma string de caracteres alfanuméricos de um determinado tamanho
helpers.createRandomString = function(strLength) {
	strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
	if (strLength) {
		// Define os caracteres que podem aparecer na string
		var possibleCharacteres = 'qwertyuiopasdfghjklzxcvbnm1234567890';

		var str = '';
		for (i = 1; i <= strLength; i++) {
			// Pegar um caracter e adicionar na string
			var randomCharacter = possibleCharacteres.charAt(Math.floor(Math.random() * possibleCharacteres.length));
			str += randomCharacter
		}

		// Retorna a string final
		return str;
	} else {
		return false;
	}
};

module.exports = helpers;
