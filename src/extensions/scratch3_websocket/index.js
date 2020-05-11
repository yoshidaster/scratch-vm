const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Variable = require('../../engine/variable');
const Cast = require('../../util/cast');
const log = require('../../util/log');

class Scratch3WebSocket {
    constructor (runtime) {
        this.runtime = runtime;
        this.ws = null;
        this.lasthat = false;
        this.queue = [];
    }

    getInfo () {
        return {
            id: 'websocket',
            name: 'WebSocket Client',
            blocks: [
                {
                    opcode: 'openSocket',
                    blockType: BlockType.COMMAND,
                    text: 'open [URL]',
                    arguments: {
                        URL: {
                            type: ArgumentType.STRING,
                            defaultValue: "ws://127.0.0.1:3000/ws"
                        }
                    }
                },
                {
                    opcode: 'closeSocket',
                    blockType: BlockType.COMMAND,
                    text: 'close socket'
                },
                {
                    opcode: 'receiveMessage',
                    blockType: BlockType.HAT,
                    text: 'when message received'
                },
                {
                    opcode: 'setMessageTo',
                    blockType: BlockType.COMMAND,
                    text: 'set [DATA] to received message',
                    arguments: {
                        DATA: {
                            type: ArgumentType.OBJECT,
                            defaultValue: ""
                        }
                    }
                },
                {
                    opcode: 'getDataPropertiy',
                    blockType: BlockType.REPORTER,
                    text: 'DATA [DATA] [KEY]',
                    arguments: {
                        DATA: {
                            type: ArgumentType.OBJECT,
                            defaultValue: ""
                        },
                        KEY: {
                            type: ArgumentType.STRING,
                            defaultValue: "message"
                        }
                    }
                },
                {
                    opcode: 'setDataPropertiy',
                    blockType: BlockType.COMMAND,
                    text: 'set DATA [DATA] [KEY] to [VALUE]',
                    arguments: {
                        DATA: {
                            type: ArgumentType.OBJECT,
                            defaultValue: ""
                        },
                        KEY: {
                            type: ArgumentType.STRING,
                            defaultValue: "message"
                        },
                        VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: ""
                        }
                    }
                },
                {
                    opcode: 'sendMessage',
                    blockType: BlockType.COMMAND,
                    text: 'send [DATA]',
                    arguments: {
                        DATA: {
                            type: ArgumentType.OBJECT,
                            defaultValue: ""
                        }
                    }
                },
            ],
            menus: {
            }
        };
    }

    openSocket(args) {
        const url = Cast.toString(args.URL);
        if (this.ws) this.ws.close();
        
        this.ws = new WebSocket(url);
        log.log("open socket");

        this.ws.onmessage = (message) => {
            const json = JSON.parse(message.data);
            this.queue.push(json);
            log.log("on message", json);
        };
    }

    closeSocket(args) {
        const url = Cast.toString(args.URL);
        if (this.ws) this.ws.close();
        log.log("close socket");
    }

    receiveMessage() {
        var hat = (this.queue.length > 0 && !this.lasthat);
        this.lasthat = hat;
        return hat;
    }

    setMessageTo(args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.DATA.id,
            args.DATA.name
        );
        
        const newMessage = this.queue.shift();
        variable.value = newMessage;
    }

    getDataPropertiy(args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.DATA.id,
            args.DATA.name
        );
        if (!variable.value) return;

        return variable.value[args.KEY];
    }

    setDataPropertiy(args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.DATA.id,
            args.DATA.name
        );
        if (!variable.value) variable.value = {};

        variable.value[args.KEY] = args.VALUE;
    }

    sendMessage(args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.DATA.id,
            args.DATA.name
        );
        if (!variable.value) return;

        const message = JSON.stringify(variable.value);
        log.log(message);
        this.ws.send(message);
    }
}

module.exports = Scratch3WebSocket;