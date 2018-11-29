/*
 *
 * Variáveis de configuração
 *
 */
const enviroments = { };

// Staging (default)
enviroments.staging = {
	'httpPort': 3000,
	'httpsPort': 4000,
	'envName': 'Staging',
	'hashingSecret': 'secret_hash',
	'maxChecks': 5,
	'twilio': {
		'accountSid': 'AC726debb086715622b085f9252cc0052e',
		'authToken': '9f28055af95f5a3dfa7d127ddbcbb2d3',
		'fromPhone': '+5547996363945'
	}
};

// Produção (production)
enviroments.production = {
	'httpPort': 5000,
	'httpsPort': 443,
	'envName': 'Production',
	'hashingSecret': 'secret_hash',
	'maxChecks': 5,
	'twilio': {
		'accountSid': 'AC726debb086715622b085f9252cc0052e',
		'authToken': '9f28055af95f5a3dfa7d127ddbcbb2d3',
		'fromPhone': '+5547996363945'
	}
};

// Determina qual será o enviroment utilizado pela linha de comando
var currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.staging;

module.exports = enviromentToExport;
