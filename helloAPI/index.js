const http = require('http');
const config = require('./config');
const url = require('url');

const handlers = { };
handlers.hello = function(data, callback) {
	callback(200, { msg: 'Seja Bem-Vindo a "Hello World API"!!!' });
}

handlers.notFound = function(data, callback) {
	callback(404, { msg: 'Not Found 404' });
}

const router = {
	'hello': handlers.hello
}

const httpServer = http.createServer(function(req, res) {
	// Recebe e faz o parse a URL
	var parsedUrl = url.parse(req.url, true);
	// Caminho da URL
	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');
	// Receber a query da string como objeto
	var queryStringObject = parsedUrl.query;
	// Receber o cabeçalho como objeto
	var header = req.headers;
	// Método
	var method = req.method.toLowerCase();

	req.on('data', function(data) { });
	req.on('end', function() {
		// Seleciona o handler
		var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

		var data = {
			'trimmedPath': trimmedPath,
			'queryStringObject': queryStringObject,
			'method': method,
			'headers': header
		};

		chosenHandler(data,function(statusCode, payload) {
	        statusCode = typeof(statusCode) == 'number' ? statusCode : 404;
	        payload = typeof(payload) == 'object' ? payload : { };
	        var payloadString = JSON.stringify(payload);
	        res.setHeader('Content-Type', 'application/json');
	        res.writeHead(statusCode);
	        res.end(payloadString);
      	});
	});
});

httpServer.listen(config.httpPort, function() {
	console.log('Servidor escutando na porta ' + config.httpPort);
});
