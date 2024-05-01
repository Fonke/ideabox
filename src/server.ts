import https = require('https');
import fs = require('fs');
import ws = require('ws');
import { IncomingMessage, ServerResponse } from 'http';

type Ticket = {
  id: number;
  creation_date: number;
  title: string;
  description: string;
}

type Tickets = {
  accepted: Ticket[];
  rejected: Ticket[];
  pending: Ticket[];
}

type Validator = {
  email: string;
  auth_token: string;
}

type WSMessage = {
  auth_token: string;
  auth_jwt: string;
  name: string;
}

type CreateTicketRequest = WSMessage & {
  ticket_title: string;
  ticket_description: string;
}

type MoveTicketRequest = WSMessage & {
  ticket_id: number;
  from: string;
  to: string;
}

const homePageContent = fs.readFileSync('src/index.html', 'utf-8');
const ticketsContent = fs.readFileSync('database/tickets.json', 'utf-8');
const validatorsContent: string = fs.readFileSync('database/validators.json', 'utf-8');
let tickets: Tickets = JSON.parse(ticketsContent);
//TODO(chassa_a): do sanity checks on tickets
let validators: Validator[] = JSON.parse(validatorsContent);
//TODO(chassa_a): do sanity checks on validators
let highestTicketId: number = -1;

function parseCookies(cookiesString: string): { [key: string]: string } {
  const cookies: { [key: string]: string } = {};
  cookiesString.split(';').forEach(cookie => {
      const [name, value] = cookie.split('=').map(c => c.trim());
      cookies[name] = decodeURIComponent(value);
  });
  return cookies;
}

function generateAuthToken(): string {
  let result: string = "";
  const randomBytes: Uint8Array= crypto.getRandomValues(new Uint8Array(32));
  for (const byte of randomBytes) {
    result += byte.toString(16).padStart(2, "0");
  }

  return result;
}

function highestTicketIdFromDB(): number {
  for (const ticketsArray of Object.values(tickets)) {
    for (const ticket of ticketsArray) {
      highestTicketId = (ticket.id > highestTicketId) ? ticket.id : highestTicketId;
    }
  }

  return highestTicketId;
}

function createTicketId(): number {
  //TODO(chassa_a): check if ticket id already exists
  highestTicketId += 1;
  return highestTicketId;
}

function moveTicket(ticketId: number, fromTicketListName: string, toTicketListName: string): void {
  if (fromTicketListName === toTicketListName) {
    return;
  }
  const ticketIndex: number = tickets[fromTicketListName as keyof Tickets].findIndex((ticket: any): boolean => ticket.id == ticketId);
  if (ticketIndex == -1) {
    throw 'ticket with id: ' + ticketId + ' not found in list ' + fromTicketListName;
  }
  const ticket: any = tickets[fromTicketListName as keyof Tickets].splice(ticketIndex, 1).at(0);
  tickets[toTicketListName as keyof Tickets].push(ticket);
}

function onWSClientMessage(client: ws, message: string): void {
  console.log('from websocket client: ' + message);
  const wsmessage: WSMessage = JSON.parse(message);
  if (wsmessage.name == 'get_all_tickets') {
    client.send(JSON.stringify({name: 'tickets', params: tickets}));
  } else if (wsmessage.name == 'create_ticket') {
    const createTicketReq: CreateTicketRequest = wsmessage as CreateTicketRequest;
    const newTicket: Ticket = {
      id: createTicketId(),
      creation_date: Date.now() / 1000,
      title: createTicketReq.ticket_title,
      description: createTicketReq.ticket_description
    };
    tickets.pending.push(newTicket);
    console.log('new tickets = ' + JSON.stringify(tickets));
    client.send(JSON.stringify({name: 'tickets', params: tickets}));
  } else if (wsmessage.name == 'move_ticket') {
    const moveTicketReq: MoveTicketRequest = wsmessage as MoveTicketRequest;
    try {
      moveTicket(moveTicketReq.ticket_id, moveTicketReq.from, moveTicketReq.to);
    } catch (error: unknown) {
      let errorDesc: string = 'unknown';
      if (error instanceof Error) {
        errorDesc = error.message;
      }
      client.send(JSON.stringify({name: 'error', params: errorDesc}));
    }
    client.send(JSON.stringify({name: 'tickets', params: tickets}));
  }
}

highestTicketId = highestTicketIdFromDB();
console.log('highestTicketId = ' + highestTicketId);
const cert: Buffer = fs.readFileSync('certs/server.crt');
const certKey: Buffer = fs.readFileSync('certs/server.key');

const httpsServer: https.Server = https.createServer({cert: cert, key: certKey});
httpsServer.on("request", (request: IncomingMessage, response: ServerResponse<IncomingMessage>) => {
  let authToken: string | undefined = undefined;
  if (request.headers.cookie !== undefined) {
    authToken = parseCookies(request.headers.cookie).auth_token;
  }
  if (authToken === undefined) {
    authToken = generateAuthToken();
    console.log('generated auth_token: ' + authToken);
    //TODO(chassa_a): add path=/, SameSite=strict, Max-Age=, etc...
    response.setHeader('Set-Cookie', `auth_token=${authToken}; Secure;`);
  }
  else {
    console.log('client auth_token: ' + authToken);
  }
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end(homePageContent);
});

const wssServer = new ws.WebSocket.Server({server: httpsServer});
wssServer.on('connection', (wsc) => {
  console.log('New client connected');
  wsc.on('message', (message: string) => {
    onWSClientMessage(wsc, message);
  });
  wsc.on('error', (err) => {
    console.error('websocket client error: ' + err);
  });
});

console.log('Websocket server started');

const PORT: number = 3000;
httpsServer.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
