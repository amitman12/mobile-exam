import express from 'express';
import bodyParser = require('body-parser');


const {products} = require('./products.json');
const app = express();
const allOrders: any[] = require('./orders.json');
const PORT = 3232;
const PAGE_SIZE = 20;

let lastSyncPoint = 1;
let listeners: any[] = [];
const changedOrdersMap: { [key: string]: number; } = {};


app.use(bodyParser.json());

app.use((_, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
});

app.get('/api/orders', (req, res) => {
    const searchText = <string>(req.query.searchText || '');
    const deliveryFilter = <string>(req.query.deliveryFilter || '');
    const paymentFilter = <string>(req.query.paymentFilter || '');
    const relevantOrders = allOrders.filter(order => ((includesNameOrId(order, searchText) || includesItem(order, searchText)) &&
        (passFulfillmentStatusFilter(order, deliveryFilter)) && (passPaymentStatusFilter(order, paymentFilter))));
    const page = <number>(req.query.page || 1);
    const orders: any[] = relevantOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
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

app.get('/api/orders/:orderId/getOrderLines', (req, res) => {
    const orderId = req.params.orderId;
    if (orderId == '11634') {
    }
    const loc = allOrders.findIndex(order => order.id == orderId);
    if (loc === -1) {
        //assume order id is unique
        // edge case
        //for now we only change array in memory
        res.status(404).send('Order not found.');
        return;
    }
    const order = allOrders[loc];
    let responseArray: any[] = [];
    let countItems = 0;
    let itemLoc = 0;
    while (countItems < order.itemQuantity) {
        let currentItemId = order.items[itemLoc].id;
        responseArray.splice(itemLoc, 0, {
            item: {
                id: currentItemId,
                name: products[currentItemId].name,
                price: products[currentItemId].price,
                image: products[currentItemId].images.small
            },
            quantity: order.items[itemLoc].quantity
        });
        countItems += order.items[itemLoc].quantity;
        itemLoc++;
    }
    res.send(responseArray);

})

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
    notifyOrderChanged(orderId);
    res.sendStatus(200);
})

app.get('/api/orders/getOrderCount', (req, res) => {
    const search = <string>(req.query.searchText || '');
    const deliveryFilter = <string>(req.query.deliveryFilter || '');
    const paymentFilter = <string>(req.query.paymentFilter || '');
    const relevantOrders = allOrders.filter(order => ((includesNameOrId(order, search) || includesItem(order, search)) &&
        (passFulfillmentStatusFilter(order, deliveryFilter)) && (passPaymentStatusFilter(order, paymentFilter))));
    const len = relevantOrders.length;
    console.log(len);
    res.send({length: len});
})

app.listen(PORT);
console.log('Listening on port', PORT);


function includesNameOrId(order: any, searchText: string) {
    return (order.customer.name.toLowerCase() + order.id).includes(searchText.toLowerCase());

}

function includesItem(order: any, searchText: string) {
    //we scan the list of products for an order, to determine if an order has an item that contains the searchedText.
    // another way of implementing this is scanning products and finding all items that contain the searchedText, and then simply asking if an order has one of these items.

    let i = 0;
    while (i < order.items.length) {
        if (products[order.items[i].id].name.includes(searchText)) {
            return true;
        }
        i++;
    }
    return false;
}

function passFulfillmentStatusFilter(order: any, deliveryFilter: string) {
    if (deliveryFilter == 'Delivered') {
        console.log('here');
    }
    if (deliveryFilter == 'All') {
        return true;
    }
    return (deliveryFilter == 'Delivered' && order.fulfillmentStatus == 'fulfilled') || (deliveryFilter == 'Not Delivered' && order.fulfillmentStatus == 'not-fulfilled');

}

function passPaymentStatusFilter(order: any, paymentFilter: string) {
    if (paymentFilter == 'All') {
        return true;
    }
    return (paymentFilter == 'Paid' && order.billingInfo.status == 'paid') || (paymentFilter == 'Not Paid' && order.billingInfo.status == 'not-paid');

}


function notifyOrderChanged(orderId: string) {
    ++lastSyncPoint;
    changedOrdersMap[orderId] = lastSyncPoint;
    for (let resolveFunction of listeners) {
        //let all listeners know of the change
        resolveFunction();
    }
    //initialize listeners array
    listeners = [];
}

async function listenToChanges(timeoutInMS:number) {
    let promise = new Promise((resolve,reject) =>{
        let timer:any;
        const resolveFunction = () => {
            clearTimeout(timer);
            resolve("finished");
            //resolve promise
        };
        listeners.push(resolveFunction());

        timer = setTimeout(() => {
            listeners = listeners.filter(func => func!= resolveFunction);
            reject('timed out');
            //reject promise
        }, timeoutInMS);
    });
    await promise;
}


app.get('/api/listenToChanges', async(req, res) => {
    const syncPoint = <number>(req.query.syncPoint || 0);
    if (syncPoint === lastSyncPoint) {
        await listenToChanges(30000);
    }
    let changedOrders: any[] = [];
    for(let orderId in Object.keys(changedOrdersMap)){
        let orderLastSyncPoint = changedOrdersMap[orderId];
        if(syncPoint<lastSyncPoint){
            //TODO can be done in O(1) if we use orders.json?
            changedOrders.push(allOrders.filter((order) => order.id == orderId));
        }
    }
    res.send({
        changedOrders:changedOrders,
        syncPoint:lastSyncPoint
    })
})
