 /*
 *
 * Handlers
 *
 */
// Dependencias
const _data = require('./data');
const helpers = require('./helpers');

const handlers = { };

// Handler de Usuários
handlers.users = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];

	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._users[data.method](data, callback);
	} else {
		callback(405);
	}
};
// Container de submétodos de Usuários
handlers._users = { };

// POST - Usuários
handlers._users.post = function(data, callback) {
	// Verificar os campos
	var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement === true ? true : false;

	if (firstName && lastName && phone && password && tosAgreement) {
		// Telefone do Usuário deve ser único
		_data.read('users', phone, function(err, data) {
			if (data) {
				callback(500, { 'Error': 'Um usuário com este telefone já existe!' });
			} else {
				// Criptografar a senha
				var hashedPassword = helpers.hash(password);

				if (!hashedPassword) {
					callback(500, { 'Error': 'Não foi possível criar a chave do usuário!' });
				} else {
					// Criar Usuário
					var userObject = {
						'firstName': firstName,
						'lastName': lastName,
						'phone': phone,
						'hashedPassword': hashedPassword,
						'tosAgreement': true
					};

					// Armazenar Usuário
					_data.create('users', phone, userObject, function(err) {
						console.log(err);
						if (!err) {
							callback(200);
						} else {
							console.error(err);
							callback(500, { 'Error': 'Não foi possível criar o usuário!' });
						}
					});
				}
				
			}
		});
	} else {
		callback(400, { 'Error': 'Campos requeridos não preenchidos corretamente!' });
	}
};

// GET - Usuários
handlers._users.get = function(data, callback) {
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
	if (phone) {
		_data.read('users', phone, function(err, data) {
			if (err) {
				callback(404);
			} else {
				delete data.hashedPassword;
				callback(200, data);
			}
		});
	} else {
		callback(400, { 'Error': 'Está faltando um campo!' });
	}	
};

// PUT - Usuários
handlers._users.put = function(data, callback) {
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
	var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	// Erro caso o telefone esteja errado
	if (phone) {
		if (firstName || lastName || password) {
			// Procurar Usuário
			_data.read('users', phone, function(err, userData) {
				if (err) {
					callback(400, { 'Error': 'Usuário não encontrado!' });
				} else if (userData) {
					if (firstName) {
						userData.firstName = firstName;
					}
					if (lastName) {
						userData.lastName = lastName;
					}
					if (password) {
						userData.hashedPassword = helpers.hash(password);
					}
					_data.update('users', phone, userData, function(err) {
						if (err) {
							callback(400, { 'Error': 'Não foi possível atualizar o usuário!' });
						} else {
							callback(200);
						}
					});
				}
			});
		} else {
			callback(400, { 'Error': 'Está faltando um campo para atualizar!' })
		}
	} else {
		callback(400, { 'Error': 'Está faltando um campo!' })
	}
};

// DELETE - Usuários
handlers._users.delete = function(data, callback) {
	// Verificar se o telefone é válido
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;

	if (phone) {
		_data.read('users', phone, function(err, data) {
			if (err) {
				callback(400, { 'Error': 'Usuário não encontrado!' })
			} else if (data) {
				_data.delete('users', phone, function(err) {
					if (err) {
						callback(500, { 'Error': 'Não foi possível deletar o usuário' });
					} else {
						callback(200);
					}
				});
			}
		});
	} else {
		callback(400, { 'Error': 'Está faltando um campo!' })
	}
};

handlers.ping = function(data, callback) {
	callback(200);
};

handlers.notFound = function(data, callback) {
	callback(404);
};

module.exports = handlers;
