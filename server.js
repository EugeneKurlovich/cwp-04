const net = require('net');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const port = 3001;

const ClientREMOTEStatus = "REMOTE";
const separator = '|||||';
const serverResOKstatus = 'ACK';
const encodeAlgorithm = "aes-256-ctr";

let seed = 0;
let Clients = [];


const server = net.createServer(function (client) {

    client.on('error', function (err) {
        console.error(err);
    });
    client.on('end', function () {
        Clients[client.id] = undefined;
        console.log(`Client ${client.id} disconnected`);
    });
    client.on('data', createClientDialog);
    client.on('data', ClientDialogREMOTE);

    function createClientDialog(data) {
            if (!client.id && (data.toString() ===  ClientREMOTEStatus)) {
                client.id = getUniqId() + seed++;
                Clients[client.id] = data.toString();                                            

            console.log('Client ' + client.id + " connected: " + Clients[client.id]);
                client.write(serverResOKstatus);
                
            }
    }

    function ClientDialogREMOTE(data) {
        
            if (Clients[client.id] === ClientREMOTEStatus && data.toString() !== ClientREMOTEStatus) {
                let msgParts = data.toString().split(separator);

                let requestType = msgParts[0];
                let fileName = msgParts[1];
                let proccFileName = msgParts[2];
                let key = msgParts[3];

                switch (requestType) {
                    case "COPY":
                        createFileWithStream(fileName, proccFileName);
                        break;
                    case "ENCODE":
                        createFileWithStream(fileName, proccFileName, crypto.createCipher(encodeAlgorithm, key));
                        break;
                    case "DECODE":
                        createFileWithStream(fileName, proccFileName, crypto.createDecipher(encodeAlgorithm, key));
                        break;
                    default:
                        break;
                }
            }
    }
});

server.listen(port, 'localhost', function () {
    console.log("start server");
});

function createFileWithStream(fileName, newFileName, transformStream) {
    fs.stat(fileName, (err) => {
        if (!err) {
            const rd = fs.createReadStream(fileName);
            const ws = fs.createWriteStream(newFileName);
            if (transformStream) {
                rd.pipe(transformStream).pipe(ws);
            } else {
                rd.pipe(ws);
            }

        } else {
            console.error(err);
        }
    });
}

function getUniqId() {
    return Date.now() + seed++;
}