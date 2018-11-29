/*
 *
 * Servedor
 *
 */
// Dependencias
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const config = require('./config');
const helpers = require('./helpers');
const handlers = require('./handlers');
const path = require('path');

// Instancia o módulo do servidor
const server = {};

// Servidor HTTP
server.httpServer = http.createServer(function(req, res) {
	unifedServer(req, res);
});

// Servidor HTTPS
server.httpsServerOptions = {
	'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
	'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
}; 
server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res) {
	server.unifedServer(req, res);
});

// Rotas
server.router = {
	'ping': handlers.ping,
	'users': handlers.users,
	'tokens': handlers.tokens,
	'checks': handlers.checks
};

// HTTP e HTTPS
server.unifedServer = function(req, res) {
	// Recebe e faz o parse a URL
	var parsedUrl = url.parse(req.url, true);
	
	// Método da requisisção
	var method = req.method.toLowerCase();

	// Caminho da URL
	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');

	// Receber a query da string como objeto
	var queryStringObject = parsedUrl.query;

	// Receber o cabeçalho como objeto
	var header = req.headers;

	// Payload, se houver
	var decoder = new StringDecoder('utf-8');
	var buffer = '';
	
	req.on('data', function(data) {
		buffer += decoder.write(data);
	});

	req.on('end', function() {
		buffer += decoder.end();

		// Seleciona o handler
		var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

		var data = {
			'trimmedPath': trimmedPath,
			'queryStringObject': queryStringObject,
			'method': method,
			'headers': header,
			'payload': helpers.parseJsonToObject(buffer)
		};

		chosenHandler(data,function(statusCode, payload) {
	        statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

	        payload = typeof(payload) == 'object' ? payload : { };
	        var payloadString = JSON.stringify(payload);

	        res.setHeader('Content-Type', 'application/json');
	        res.writeHead(statusCode);
	        res.end(payloadString);
      	});
	});
}

server.init = function() {
	// Servidor HTTP na porta do enviroment
	server.httpServer.listen(config.httpPort, function() {
		console.log('Servidor HTTP na porta ' + config.httpPort + ' -> ENV: ' + config.envName);
	});
	// Servidor HTTPS na porta do enviroment
	server.httpsServer.listen(config.httpsPort, function() {
		console.log('Servidor HTTPS na porta ' + config.httpsPort + ' -> ENV: ' + config.envName);
	});
}

// Exporta o servidor
module.exports = server;
