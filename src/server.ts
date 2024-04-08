import https = require('https');
import fs = require('fs');
import ws = require('ws');
import uuid = require('uuid');

const homePageContent = fs.readFileSync('src/index.html', 'utf-8');
const ticketsContent = fs.readFileSync('database/tickets.json', 'utf-8');
let tickets = JSON.parse(ticketsContent);

function moveTicket(ticketId: string, fromTicketListName: string, toTicketListName: string): void {
  if (fromTicketListName === toTicketListName) {
    return;
  }
  const ticketIndex: number = tickets[fromTicketListName].findIndex((ticket: any): boolean => ticket.id == ticketId);
  if (ticketIndex == -1) {
    throw 'ticket with id: ' + ticketId + ' not found in list ' + fromTicketListName;
  }
  const ticket: any = tickets[fromTicketListName].splice(ticketIndex, 1).at(0);
  tickets[toTicketListName].push(ticket);
}

function onWSClientMessage(client: ws, message: string): void {
  console.log('from websocket client: ' + message);
  const request = JSON.parse(message);
  if (request.name == 'get_all_tickets') {
    client.send(JSON.stringify({name: 'tickets', params: tickets}));
  } else if (request.name == 'create_ticket') {
    const newTicket = {
      id: uuid.v4(),
      creation_date: Date.now() / 1000,
      title: request.params.ticket_title,
      description: request.params.ticket_description
    };
    tickets.pending.push(newTicket);
    console.log('new tickets = ' + JSON.stringify(tickets));
    client.send(JSON.stringify({name: 'tickets', params: tickets}));
  } else if (request.name == 'move_ticket') {
    try {
      moveTicket(request.params.ticket_id, request.params.from, request.params.to);
    } catch (error) {
      client.send(JSON.stringify({name: 'error', params: {description: 'ticket not found'}}));
    }
    client.send(JSON.stringify({name: 'tickets', params: tickets}));
  }
}

const cert: Buffer = fs.readFileSync('certs/server.crt');
const certKey: Buffer = fs.readFileSync('certs/server.key');

const wsServer = new ws.WebSocket.Server({port: 8080});
wsServer.on('connection', (wsc) => {
  console.log('New client connected');
  wsc.on('message', (message: string) => {
    onWSClientMessage(wsc, message);
  });
  wsc.on('error', (err) => {
    console.error('websocket client error: ' + err);
  });
});

console.log('Websocket server started');

const server: https.Server = https.createServer({cert: cert, key: certKey});
server.on("request", (request, response) => {
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end(homePageContent);
});

const PORT: number = 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
