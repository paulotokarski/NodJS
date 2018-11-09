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
		// Token do header
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
		// Verificar se o token é válido com o telefone
		handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
			if (!tokenIsValid) {
				callback(403, { 'Error': 'O token não está no header ou não é válido!' });
			} else {
				_data.read('users', phone, function(err, data) {
					if (err) {
						callback(404);
					} else {
						delete data.hashedPassword;
						callback(200, data);
					}
				});
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
			// Token do header
			var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
			// Verificar se o token é válido com o telefone
			handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
				if (!tokenIsValid) {
					callback(403, { 'Error': 'O token não está no header ou não é válido!' });
				} else {
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
		// Token do header
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
		// Verificar se o token é válido com o telefone
		handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
			if (!tokenIsValid) {
				callback(403, { 'Error': 'O token não está no header ou não é válido!' });
			} else {
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
			}
		});
	} else {
		callback(400, { 'Error': 'Está faltando um campo!' });
	}
};

// Handler de Tokens
handlers.tokens = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];

	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._tokens[data.method](data, callback);
	} else {
		callback(405);
	}
};
// Container de submétodos de Tokens
handlers._tokens = { };

handlers._tokens.post = function(data, callback) {
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	if (phone && password) {
		// Verificar o Usuário do telefone
		_data.read('users', phone, function(err, userData) {
			if (err) {
				callback(400, { 'Error': 'Usuário não encontrado!' });
			} else if (userData) {
				// Criptografar senha e comparar com a do Usuário
				var hashedPassword = helpers.hash(password);
				if (hashedPassword == userData.hashedPassword) {
					// Criar token com 1 hora para expirar
					var tokenId = helpers.createRandomString(20);
					var expires = Date.now() + 1000 * 60 * 60;
					var tokenObject = {
						'phone': phone,
						'id': tokenId,
						'expires': expires
					};

					// Armazenar token
					_data.create('tokens', tokenId, tokenObject, function(err) {
						if (err) {
							callback(500, { 'Error': 'Não foi possível criar o token!', })
						} else {
							callback(200, tokenObject);
						}
					});
				} else {
					callback(400, { 'Error': 'Senha incorreta!' });
				}
			}
		});
	} else {
		callback(400, { 'Error': 'Está faltando um campo!' });
	}
};

handlers._tokens.get = function(data, callback) {
	// Verificar se o id é valido
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if (id) {
		// Verifica o token
		_data.read('tokens', id, function(err, tokenData) {
			if (err){
				callback(404);
			} else {
				callback(200, tokenData);
			}
		});
	} else {
		callback(400, { 'Error': 'Está faltando um campo!' });
	}
};

handlers._tokens.put = function(data, callback) {
	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
	var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
	
	if(id && extend){
		// Verificar se o token existe
		_data.read('tokens', id, function(err, tokenData) {
			if(err) {
				callback(400, { 'Error' : 'O token não existe!' }); 
			} else if (tokenData) {
				// Verifica se o token já expirou ou não
				if (tokenData.expires > Date.now()) {
					// Aumenta o tempo do token em uma hora
					tokenData.expires = Date.now() + 1000 * 60 * 60;
					// Atualiza
					_data.update('tokens', id, tokenData, function(err) {
						if (err) {
							callback(500,{ 'Error' : 'Não foi possível atualizar o token!' });
						} else {
							callback(200);
						}
					});
				} else {
					callback(400,{ 'Error' : 'Este token já expirou e não é possível atualizar ele!' });
				}
			}
		});
	} else {
		callback(400, { 'Error': 'Está faltando um campo!' });
	}
};

handlers._tokens.delete = function(data, callback) {
	// Verifica se o id é válido
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if (id) {
		// Verifica o token
		_data.read('tokens', id, function(err, tokenData) {
			if(!err && tokenData){
				// Deleta o token
				_data.delete('tokens', id, function(err) {
					if(err) {
						callback(500, {'Error' : 'Não foi possível deletar o token!' });
					} else {
						callback(200);
					}
				});
			} else {
				callback(400,{'Error' : 'Não foi possível encontrar o token!'});
			}
		});
	} else {
		callback(400,{'Error' : 'Missing required field'})
	}
};

// Verifica se o id do token pertence a um Usuário
handlers._tokens.verifyToken = function(id, phone, callback) {
	_data.read('tokens', id, function(err, tokenData) {
		if (err) {
			callback(false);
		} else if (tokenData) {
			// Verifica se o token é do Usuário e se não expirou
			if (tokenData.phone === phone && tokenData.expires > Date.now()) {
				callback(true);
			} else {
				callback(false);
			}
		}
	});
};

handlers.ping = function(data, callback) {
	callback(200);
};

handlers.notFound = function(data, callback) {
	callback(404);
};

module.exports = handlers;
