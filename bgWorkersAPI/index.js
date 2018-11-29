/*
 *
 * Arquivo principal da API
 *
 */
// Dependencias
const server = require('./lib/server');
const workers = require('./lib/workers');

// Declara a aplicação
const app = {};

app.init = function() {
	// Inicia o servidor
	server.init();
	// Inicia o workers
	workers.init();
};

// Executa
app.init();

module.exports = app;
