 /*
 *
 * Arquivo de dados
 *
 */

const fs = require('fs');
const path = require('path');

const lib = { };

// Diretório base da pasta de arquivos
lib.baseDir = path.join(__dirname, '/../.data/');

// Salvar dados em um arquivo
lib.create = function(dir, file, data, callback) {
	// Abrir arquivo
	fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function(err, fileDescriptor) {
		if (err) {
			callback('Erro ao criar o arquivo. Talvez o arquivo já exista!');
		} else if (fileDescriptor) {
			var stringData = JSON.stringify(data);

			// Escrever arquivo
			fs.writeFile(fileDescriptor, stringData, function(err) {
				if (err) {
					callback('Erro ao escrever o arquivo!');
				} else {
					fs.close(fileDescriptor, function(err) {
						if (err) {
							callback('Erro ao fechar o arquivo');
						} else {
							callback(false);
						}
					});
				}
			});
		}
	});
};

// Ler dados de um arquivo
lib.read = function(dir, file, callback) {
	fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', function(err, data) {
		callback(err, data);
	});
};

// Atualizar dados de um arquivo
lib.update = function(dir, file, data, callback) {
	// Abrir arquivo para leitura
	fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function(err, fileDescriptor) {
		if (err) {
			callback('Não foi possível abrir o arquivo para atualização! Talvez o arquvi não exista');
		} else if (fileDescriptor) {
			var stringData = JSON.stringify(data);
			fs.truncate(fileDescriptor, function(err) {
				if (err) {
					callback('Erro ao truncar o arquivo');
				} else {
					fs.writeFile(fileDescriptor, stringData, function(err) {
						if (err) {
							callback('Erro ao escrever no arquivo!');
						} else {
							fs.close(fileDescriptor, function(err) {
								if (err) {
									callback('Erro ao fechar o arquivo');
								} else {
									callback(false);
								}
							})
						}
					});
				}
			});
		}
	});
};

// Deletar um arquivo
lib.delete = function(dir, file, callback) {
	// Unlink arquivo
	fs.unlink(lib.baseDir + dir + '/' + file + '.json', function(err) {
		if (err) {
			callback('Error ao deletar o arquivo. Talvez ele não exista!');
		} else {
			callback(false);
		}
	})
};

module.exports = lib;
