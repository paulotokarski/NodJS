 /*
 *
 * Handlers
 *
 */
// Dependencias
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config'); 

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
								// Deletar cada checks associado ao Usuário
								var userChecks = typeof(data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];
								var checksToDelete = userChecks.length;

								if (checksToDelete > 0) {
									var checksDeleted = 0;
									var deletionsErrors = false;

									// Loop de checks
									userChecks.forEach(function(checkId) {
										_data.delete('checks', checkId, function(err) {
											if (err) {
												deletionsErrors = true;
											}

											checksDeleted++;
											if (checksDeleted === checksToDelete) {
												if (!deletionsErrors) {
													callback(200);
												} else {
													callback(500, { 'Error': 'Erro ao deletar os checks do Usuário!' });
												}
											}
										});
									});
								}
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

// POST - Tokens
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

// GET - Tokens
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

// PUT - Tokens
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

// DELETE - Tokens
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

// Handler de Checks
handlers.checks = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];

	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._checks[data.method](data, callback);
	} else {
		callback(405);
	}
};
// Container de submétodos de Checks
handlers._checks = { };

// POST - Checks
handlers._checks.post = function(data, callback) {
	// Validar as entradas
	var protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol.trim() : false;
	var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
	var method = typeof(data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method.trim() : false;
	var successCode = typeof(data.payload.successCode) == 'object' && data.payload.successCode instanceof Array && data.payload.successCode.length > 0 ? data.payload.successCode : false;
	var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

	if (protocol && url && method && successCode && timeoutSeconds) {
		// Pegar o token dos headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
		// Verificar o token
		_data.read('tokens', token, function(err, tokenData) {
			if (err) {
				callback(403, { 'Error': 'Erro ao verificar o token' });
			} else if (tokenData) {
				var userPhone = tokenData.phone;
				// Verificar o Usuário pelo telefone
				_data.read('users', userPhone, function(err, userData) {
					if (err) {
						callback(403, { 'Error': 'Erro ao verificar o usuário' });
					} else if (userData) {
						var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
						// Verificar o máximo de checks do Usuário
						if (userChecks.length < config.maxChecks) {
							// Criar um ID para o check
							var checkId = helpers.createRandomString(20);
							// Criar um objeto de check
							var checkObject = {
								'id': checkId,
								'userPhone': userPhone,
								'protocol': protocol,
								'url': url,
								'successCode': successCode,
								'timeoutSeconds': timeoutSeconds
							};
							// Armazenar objeto
							_data.create('checks', checkId, checkObject, function(err) {
								if (err) {
									callback(500, { 'Error': 'Não foi possível criar o check!' });
								} else {
									// Adicionar o ID do check ao Usuário
									userData.checks = userChecks;
									userData.checks.push(checkId);

									_data.update('users', userPhone, userData, function(err) {
										if (err) {
											// Retorna o dado do check
											callback(500, { 'Error': 'Não foi possível atualizar o check do Usuário!' });
										} else {
											callback(200, checkObject);
										}
									});
								}
							});
						} else {
							callback(400, { 'Error': 'Máximo de ' + config.maxChecks + ' checks!' });
						}
					}
				});
			}
		});
	} else {
		callback(400, { 'Error': 'Entrada de dados inváloda!' });
	}
};

// GET - Checks
handlers._checks.get = function(data, callback) {
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
	if (id) {
		// Verificar o check
		_data.read('checks', id, function(err, checkData) {
			if (err) {
				callback(404, { 'Error': 'Não foi possível encontrar o check!' });
			} else if (checkData) {
				// Token do header
				var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
				// Verifica se o check pertence ao Usuário
				handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
					if (!tokenIsValid) {
						callback(403);
					} else {
						callback(200, checkData);
					}
				});
			}
		});

	} else {
		callback(400, { 'Error': 'Está faltando um campo!' });
	}
};

// PUT - Check
handlers._checks.put = function(data, callback) {
	// Validar as entradas
	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;
	var protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol.trim() : false;
	var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
	var method = typeof(data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method.trim() : false;
	var successCode = typeof(data.payload.successCode) == 'object' && data.payload.successCode instanceof Array && data.payload.successCode.length > 0 ? data.payload.successCode : false;
	var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

	if (id) {
		if (protocol || url || method || successCode || timeoutSeconds) {
			_data.read('checks', id, function(err, checkData) {
				if (err) {
					callback(400, { 'Error': 'Não foi possível encontrar o ID!' });
				} else if(checkData) {
					// Token do header
					var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
					// Verifica se o check pertence ao Usuário
					handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
						if (!tokenIsValid) {
							callback(403);
						} else {
							// Atualiza os campos, se foram alterados
							if (protocol) {
								checkData.protocol = protocol;
							}
							if (url) {
								checkData.url = url;
							}
							if (method) {
								checkData.method = method;
							}
							if (successCode) {
								checkData.successCode = successCode;
							}
							if (timeoutSeconds) {
								checkData.timeoutSeconds = timeoutSeconds;
							}
							// Armazenar as atualizações
							_data.update('checks', id, checkData, function(err) {
								if (err) {
									callback(500, { 'Error': 'Não foi possível atualizar o check!' });
								} else {
									callback(200);
								}
							});
						}
					});
				}
			});
		} else {
			callback(400, { 'Error': 'Faltando campos para atualizar!' });
		}
	} else {
		callback(400, { 'Error': 'Campo requerido ID faltanto!' });
	}
}

// DELETE - Check
handlers._checks.delete = function(data, callback) {
	// Verificar se o ID é válido
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
	_data.read('checks', id, function(err, checkData) {
		if (err) {
			callback(400, { 'Error': 'Não foi possível encontrar o ID!' });
		} else if(checkData) {
			// Token do header
			var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
			// Verificar se o token é válido com o telefone
			handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
				if (!tokenIsValid) {
					callback(403, { 'Error': 'O token não está no header ou não é válido!' });
				} else {
					// Deletar o check
					_data.delete('checks', id, function(err) {
						if (err) {
							callback(500, { 'Error': 'Não foi possível deletar o check!' })
						} else if (data) {
							_data.read('users', checkData.userPhone, function(err, userData) {
								var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
								// Remover o check deletado do Usuário
								var checkPosition = userChecks.indexOf(id);
								if (checkPosition > -1) {
									userChecks.splice(checkPosition, 1);
									// Atualizar a informação do Usuário
									_data.update('users', checkData.userPhone, userData, function(err) {
										if (err) {
											callback(400, { 'Error': 'Não foi possível atualizar o usuário!' });
										} else {
											callback(200);
										}
									});

								} else {
									callback(500, { 'Error': 'Check não encontrado no Usuário!' });
								}
							});
						}
					});
				}
			});
		} else {
			callback(400, { 'Error': 'Está faltando um campo!' });
		}
	});
}

handlers.ping = function(data, callback) {
	callback(200, { 'msg': 'PING ok!' });
};

handlers.notFound = function(data, callback) {
	callback(404);
};

module.exports = handlers;
