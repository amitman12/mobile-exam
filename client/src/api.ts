import axios from 'axios';

export type Customer = {
    name: string;
}

export type BillingInfo = {
    status: string;
}

export type Price = {
    formattedTotalPrice: string;
}

export type Order = {
    id: number;
    createdDate: string;
    fulfillmentStatus: string;
    billingInfo: BillingInfo;
    customer: Customer;
    itemQuantity: number;
    price: Price;
}

export type Item = {
    id: string;
    name: string;
    price: number;
    image: string;
}
//line in ExpandingLabel..
export type OrderLine = {
    item: Item;
    quantity: number;
}

export type ApiClient = {
    getOrders: () => Promise<Order[]>;
    getItem: (itemId: string) => Promise<Item>;
    changeOrderDeliveryStatus: (orderId: number, deliveryStatus: string) => Promise<void>;
    getOrderLines: (orderId: number) => Promise<OrderLine[]>;
}

export const createApiClient = (): ApiClient => {
    return {
        getOrders: () => {
            return axios.get(`http://localhost:3232/api/orders`).then((res) => res.data);
        },
        getItem: (itemId: string) => {
            return axios.get(`http://localhost:3232/api/items/${itemId}`).then((res) => res.data);
        },
        //added below
        changeOrderDeliveryStatus: (orderId: number, deliveryStatus: string) => {
            return axios.post(`http://localhost:3232/api/orders/${orderId}/changeOrderDeliveryStatus`, {
                deliveryStatus: deliveryStatus
            }).then((res) => res.data);
        },
        getOrderLines: (orderId: number) => {
            return axios.get(`http://localhost:3232/api/orders/${orderId}/getOrderLines`).then((res) => res.data);
        }
    }
}

