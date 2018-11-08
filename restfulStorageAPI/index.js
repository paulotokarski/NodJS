 /*
 *
 * Arquivo principal da API
 *
 */

// Dependencias
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

// Servidor HTTP
const httpServer = http.createServer(function(req, res) {
	unifedServer(req, res);
});

// Servidor HTTP na porta do enviroment
httpServer.listen(config.httpPort, function() {
	console.log('Servidor na porta ' + config.httpPort + ' -> ENV: ' + config.envName);
});

// Servidor HTTPS
httpsServerOptions = {
	'key': fs.readFileSync('./https/key.pem'),
	'cert': fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, function(req, res) {
	unifedServer(req, res);
});

// Servidor HTTPS na porta do enviroment
httpsServer.listen(config.httpsPort, function() {
	console.log('Servidor na porta ' + config.httpsPort + ' -> ENV: ' + config.envName);
});

// Handlers
const handlers = { };
handlers.ping = function(data, callback) {
	callback(200);
};

handlers.sample = function(data, callback) {
	callback(406, { name: 'sample handler'});
};

handlers.notFound = function(data, callback) {
	callback(404);
};

// Rotas
const router = {
	'sample': handlers.sample,
	'ping': handlers.ping
};

// HTTP e HTTPS
const unifedServer = function(req, res) {
	// Recebe e faz o parse a URL
	var parsedUrl = url.parse(req.url, true);

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
		var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

		var data = {
			'trimmedPath': trimmedPath,
			'queryStringObject': queryStringObject,
			'method': method,
			'headers': header,
			'payload': buffer
		};

		chosenHandler(data,function(statusCode, payload) {
	        statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

	        payload = typeof(payload) == 'object' ? payload : { };
	        var payloadString = JSON.stringify(payload);

	        res.setHeader('Content-Type', 'application/json');
	        res.writeHead(statusCode);
	        res.end(payloadString);
	        console.log(trimmedPath, statusCode);
      	});

		// Método da requisisção
		var method = req.method.toLowerCase();

		// Caminho requisitado
		console.log('REQ path: ' + trimmedPath + ', método utilizado: ' + method + ' com estes parametros de string: ', queryStringObject);
		console.log('Cabeçalho recebido ', header);
		console.log('Payload: ', buffer);

		res.end('Hello World!\n');
	});
}
