const AbstractCommand = require('discord-bot-base').AbstractCommand;
const Request         = require('../Model/Request');
const MessageHelper   = require('../Helper/MessageHelper');

const PER_PAGE = 5;

class RequestsCommand extends AbstractCommand {
    static get name() { return 'requests'; }

    static get description() { return 'List all requests'; }

    initialize() {
        this.prefix = this.container.getParameter('prefix');
        this.helper = new MessageHelper(this.client, this.message);
    }


    handle() {
        if (!this.helper.isDJ()) {
            return false;
        }

        this.responds(/^requests\s?(\d+)?$/, (matches) => {
            let page = matches[1] !== undefined ? parseInt(matches[1]) : 1;

            this.findRequests(page);
        });
    }

    findRequests(page, playlistName) {
        Request.find({request: true}, (err, requests) => {
            if (!requests) {
                return this.reply("There are no requests");
            }

            let message = `There are currently ${requests.length} request(s): \n`,
                pages   = requests.length % PER_PAGE === 0
                    ? requests.length / PER_PAGE
                    : Math.floor(requests.length / PER_PAGE) + 1;

            if (pages > 1) {
                message += `Page **${page} / ${pages}**:\n`;
            }

            message += "\n";

            let delay = 0;
            for (let index = PER_PAGE * (page - 1); index < (PER_PAGE * page); index++) {
                let request = requests[index], user;
                if (request === undefined) {
                    break;
                }

                user = this.client.users.get('id', request.user);

                if (message.length >= 1800) {
                    delay += 50;
                    this.sendMessage(this.message.channel, message, delay);
                    message = '';
                }

                message += `
\`${index + 1}.\` **${user.name}** requested: **${request.link}**
\t\t**${request.name}** by **${user.name}**
\t\t\`${this.prefix}approve ${request.id} <${playlistName === undefined ? 'playlist name' : playlistName}>\`
`;
            }

            if (pages > 1) {
                message += "\n";
                if (page < pages) {
                    message += `To show the next page, type \`${this.prefix}request ${page + 1}\``;
                }
                if (page < pages && page > 1) {
                    message += "\n";
                }
                if (page > 1) {
                    message += `To show the previous page, type \`${this.prefix}request ${page - 1}\``;
                }
            }
            message += "\n";

            this.sendMessage(this.message.channel, message, delay + 50);
        });
    }
}

module.exports = RequestsCommand;
