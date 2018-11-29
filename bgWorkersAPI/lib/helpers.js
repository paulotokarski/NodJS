 /*
 *
 * Helpers
 *
 */
// Dependencias
const crypto = require('crypto'); 
const config = require('./config');
const https = require('https');
const querystring = require('querystring');

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
};

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

// Enviar SMS via Twilio
helpers.sendTwilioSms = function(phone, msg, callback) {
	var phone = typeof(phone) == 'string' && phone.trim().length > 10 ? phone.trim() : false;
	var msg = typeof(msg) == 'string' && msg.trim().length <= 1600 ? msg.trim() : false;

	if (phone && msg) {
		// Configurar o payload da requisição
		var payload = {
			'From': config.twilio.fromPhone,
			'To': '+55' + phone,
			'Body': msg
		};

		var stringPayload = querystring.stringify(payload);

		// Configurar os detalhes da requisição
		var requestDetails = {
			'protocol' : 'https:',
			'hostname' : 'api.twilio.com',
			'method' : 'POST',
			'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
			'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
			'headers' : {
				'Content-Type' : 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(stringPayload)
			}
		};

		// Instanciar a requisição
		var req = https.request(requestDetails, function(res) {
			// Status da requisição
			var status = res.statusCode;
			// Verifica o sucesso
			if (status === 200 || status === 201) {
				callback(false);
			} else {
				callback('Status recebido: ' + status);
			}
		});

		// Se houver o erro
		req.on('error', function(e) {
			callback(e);
		});
		// Adicionar ao payload
		req.write(stringPayload);
		// Finalizar a requisição
		req.end();
	} else {
		callback('Estão faltando parâmetros!');
	}
};

module.exports = helpers;
