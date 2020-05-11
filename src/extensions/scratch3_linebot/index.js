const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const log = require('../../util/log');

class Scratch3LineBot {
    constructor (runtime) {
        this.runtime = runtime;
        this.apiUrl = 'wss://linebot-scratch-gateway.herokuapp.com/ws';
        this.ws = null;
        this.lasthat = false;
        this.queue = [];
        this.grabbedMessage = null;
    }

    getInfo () {
        return {
            id: 'linebot',
            name: 'LINE BOT',
            blocks: [
                {
                    opcode: 'connectAPI',
                    blockType: BlockType.COMMAND,
                    text: 'APIに接続する [TOKEN]',
                    arguments: {
                        TOKEN: {
                            type: ArgumentType.STRING,
                            defaultValue: "token"
                        }
                    }
                },
                {
                    opcode: 'checkConnection',
                    blockType: BlockType.BOOLEAN,
                    text: 'API接続中'
                },
                {
                    opcode: 'disconnectAPI',
                    blockType: BlockType.COMMAND,
                    text: 'APIとの接続を切る'
                },
                {
                    opcode: 'receiveMessage',
                    blockType: BlockType.HAT,
                    text: '新しいメッセージを受け取った時'
                },
                {
                    opcode: 'grabNewMessage',
                    blockType: BlockType.COMMAND,
                    text: '次のメッセージを取り出す'
                },
                {
                    opcode: 'messageBody',
                    blockType: BlockType.REPORTER,
                    text: 'メッセージ本文'
                },
                {
                    opcode: 'messageSender',
                    blockType: BlockType.REPORTER,
                    text: 'メッセージ送信した人'
                },
                {
                    opcode: 'replyMessage',
                    blockType: BlockType.COMMAND,
                    text: '返信する [TEXT]',
                    arguments: {
                        TEXT: {
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

    connectAPI(args) {
        const token = Cast.toString(args.TOKEN);
        if (this.ws) this.ws.close();
        
        this.ws = new WebSocket(`${this.apiUrl}?token=${token}`);
        log.log("open socket");

        this.ws.onmessage = (message) => {
            const json = JSON.parse(message.data);
            this.queue.push(json);
            log.log("on message", json);
        };

        this.ws.onclose = () => {
            this.ws = null;
            log.log("close socket");
        };
    }

    checkConnection() {
        return this.ws !== null;
    }

    disconnectAPI() {
        if (this.ws)
            this.ws.close();
    }

    receiveMessage() {
        var hat = (this.queue.length > 0 && !this.lasthat);
        this.lasthat = hat;
        return hat;
    }

    grabNewMessage() {
        const newMessage = this.queue.shift();
        this.grabbedMessage = newMessage;
    }

    messageBody() {
        return this.grabbedMessage ? this.grabbedMessage.text : '';
    }

    messageSender() {
        return this.grabbedMessage ? this.grabbedMessage.sender : '';
    }

    replyMessage(args) {
        if (this.ws) {
            const replyText = Cast.toString(args.TEXT);
            const payload = JSON.stringify({
                id: this.grabbedMessage.id,
                text: replyText
            });
            console.log(payload);
            this.ws.send(payload);
            this.grabbedMessage = null;
        } else {
            log.log('lost socket');
        }
    }
}

module.exports = Scratch3LineBot;