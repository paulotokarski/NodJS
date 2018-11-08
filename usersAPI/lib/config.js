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
	'hashingSecret': 'secret_hash'
};

// Produção (production)
enviroments.production = {
	'httpPort': 5000,
	'httpsPort': 443,
	'envName': 'Production',
	'hashingSecret': 'secret_hash'
};

// Determina qual será o enviroment utilizado pela linha de comando
var currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.staging;

module.exports = enviromentToExport;
