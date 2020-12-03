import express from 'express';
import bodyParser = require('body-parser');

const {products} = require('./products.json');

const app = express();
const allOrders: any[] = require('./orders.json');

const PORT = 3232;
const PAGE_SIZE = 20;

app.use(bodyParser.json());

app.use((_, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
});

app.get('/api/orders/', (req, res) => {
    const page = <number>(req.query.page || 1);
    const orders: any[] = allOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    res.send(orders);
});

app.get('/api/items/:itemId', (req, res) => {
    const itemId = <string>(req.params.itemId);
    const size = <string>(req.query.size || 'large');
    const product = products[itemId];
    res.send({
        id: itemId,
        name: product.name,
        price: product.price,
        image: product.images[size]
    });
});

app.post('/api/orders/:orderId/changeOrderDeliveryStatus', (req, res) => {
    const orderId = req.params.orderId;
    const deliveryStatus = req.body.deliveryStatus;
    const loc = allOrders.findIndex(order => order.id == orderId);
    if (loc === -1) {
        //assume order id is unique
        // edge case
        //for now we only change array in memory
        res.status(404).send('Order not found.');
        return;
    }
    const order = allOrders[loc];
    order.fulfillmentStatus = deliveryStatus;
    res.status(200).send();
})


app.listen(PORT);
console.log('Listening on port', PORT);

