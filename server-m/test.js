const chai = require('chai');
const crypto = require('crypto');
const chaiHttp = require('chai-http');
const fs = require('fs');
const expect = chai.expect;
const app = require('./proxy.js');
chai.use(chaiHttp);

const ecdh = crypto.createECDH('secp521r1');
ecdh.generateKeys();
const publicKey = ecdh.getPublicKey();
let sharedSecret;

describe('Proxy Server', () => {
	it('POST /api/exchange-keys: It should exchange keys', (done) => {
        chai.request(app)
            .post('/api/exchange-keys')
            .send({ publicKey: publicKey.toString('base64') })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.be.a('object');
                expect(res.body).to.have.property('publicKey');
				const backendPublicKey = Buffer.from(res.body.publicKey, 'base64');
				const sharedSecretKey = ecdh.computeSecret(backendPublicKey);
				sharedSecret = crypto.createHmac('sha256', sharedSecretKey).update('encryption key').digest();
                done();
            });
    });

    it('POST /api/upload: It should upload a file', (done) => {
        let fileData = fs.readFileSync('./what.mp4');
		let iv = crypto.randomBytes(16);
		const cipher = crypto.createCipheriv('aes-256-gcm', sharedSecret, iv);
		const encryptedData = Buffer.concat([cipher.update(fileData), cipher.final()]);
		const authTag = cipher.getAuthTag();
        chai.request(app)
            .post('/api/upload')
            .send({ 
				data: encryptedData.toString('base64'), 
				iv: iv.toString('base64'), 
				authTag: authTag.toString('base64'), 
				filename: 'what.mp4' 
			})
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.be.a('object');
                expect(res.body).to.have.property('message').eql('Encrypted data from upload stored successfully!');
                done();
            });
    });

    it('GET /api/download/:fileName: It should download a file', (done) => {
        chai.request(app)
            .get('/api/download/what.mp4')
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.be.a('object');
                expect(res.body).to.have.property('data');
                expect(res.body).to.have.property('iv');
                expect(res.body).to.have.property('authTag');
                done();
            });
    });

    it('GET /api/files: It should fetch all files', (done) => {
        chai.request(app)
            .get('/api/files')
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.be.a('array');
                done();
            });
    });
});
