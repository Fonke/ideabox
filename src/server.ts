import http = require('http');
import fs = require('fs');
import ws = require('ws');
import uuid = require('uuid');

const homePageContent = fs.readFileSync('src/index.html', 'utf-8');
const ticketsContent = fs.readFileSync('database/tickets.json', 'utf-8');
let tickets = JSON.parse(ticketsContent);


function onWSClientMessage(client: ws, message: string): void {
  console.log('from websocket client: ' + message);
  const request = JSON.parse(message);
  if (request.name == 'get_all_tickets') {
    client.send(JSON.stringify(tickets));
  } else if (request.name == 'create_ticket') {
    const newTicket = {
      id: uuid.v4(),
      creation_date: Date.now() / 1000,
      title: request.params.ticket_title,
      description: request.params.ticket_description
    };
    tickets.tickets.pending.push(newTicket);
    console.log('new tickets = ' + JSON.stringify(tickets));
    client.send(JSON.stringify(tickets));
  } else if (request.name == 'accept_ticket') {
    console.log('tickets.tickets.pending = ' + tickets.tickets.pending);
    const ticketIndex: number = tickets.tickets.pending.findIndex((ticket: any) => ticket.id == request.params.ticket_id);
    if (ticketIndex == -1) {
      client.send(JSON.stringify({name: 'error', params: {description: 'ticket not found in pending list'}}));
      return;
    }
    const ticket = tickets.tickets.pending.splice(ticketIndex, 1).at(0);
    tickets.tickets.accepted.push(ticket);
    client.send(JSON.stringify(tickets));
  }
}

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

const server: http.Server = http.createServer()
server.on("request", (request, response) => {
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end(homePageContent);
});

const PORT: number = 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
