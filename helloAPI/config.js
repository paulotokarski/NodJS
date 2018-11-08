/*
 *
 * Variáveis de configuração
 *
 */
 const enviroments = { };

 enviroments.default = {
 	'httpPort': 3000,
 	'httpsPort': 4000,
 	'envName': 'Default'
 };

  enviroments.production = {
 	'httpPort': 5000,
 	'httpsPort': 6000,
 	'envName': 'Prodction'
 };

 var currentEviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
 var enviromentToExport = typeof(enviroments[currentEviroment]) == 'object' ? enviroments[currentEviroment] : enviroments.default;

 module.exports = enviromentToExport;
 