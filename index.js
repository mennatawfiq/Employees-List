const WebSocket = require("ws");
const express = require("express");
const app = express()
const { createServer } = require('node:http');
const path = require("path")

const server = createServer(app);

app.use("/", express.static(path.resolve(__dirname, "./client")));

app.get("/", (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

server.listen(4000, (req, res) => {
    console.log('hi from ws');
});

const wsServer = new WebSocket.Server({ noServer: true });

let employeesList = [];

wsServer.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'sync', employees: employeesList })); // Send current state to new client

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'add') {
            employeesList.push(data.employee);
        } else if (data.type === 'edit') {
            employeesList = employeesList.map(emp =>
                emp.id == data.employee.id ? data.employee : emp
            );
        } else if (data.type === 'delete') {
            employeesList = employeesList.filter(emp => emp.id != data.id);
        }

        // Broadcast the update to all clients
        const broadcastData = JSON.stringify({ type: data.type, ...data });
        wsServer.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(broadcastData);
            }
        });
    });
});

server.on('upgrade', function upgrade(request, socket, head) {
    if (request.url === '/') {
        wsServer.handleUpgrade(request, socket, head, function done(ws) {
            wsServer.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});