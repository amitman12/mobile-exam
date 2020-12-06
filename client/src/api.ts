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
export type WaitForOrderChangesResponse = {
    changedOrders: Order[];
    newSyncPoint: number;
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
export type OrderLine = {
    item: Item;
    quantity: number;
}

export type ApiClient = {
    getOrders: (searchText: string, page: number, deliveryFilter: string, paymentFilter: string) => Promise<Order[]>;
    getItem: (itemId: string) => Promise<Item>;
    changeOrderDeliveryStatus: (orderId: number, deliveryStatus: string) => Promise<void>;
    getOrderLines: (orderId: number) => Promise<OrderLine[]>;
    getOrderCount: (searchText: string, deliveryFilter: string, paymentFilter: string) => Promise<number>;
    listenToChanges: (syncPoint: number) => Promise<WaitForOrderChangesResponse>;
}


export const createApiClient = (): ApiClient => {
    return {
        getOrders: (searchText: string, page: number, deliveryFilter: string, paymentFilter: string) => {
            return axios.get(`http://localhost:3232/api/orders`, {
                params: {
                    page: page,
                    searchText: searchText,
                    deliveryFilter: deliveryFilter,
                    paymentFilter: paymentFilter
                }
            }).then((res) => res.data);
        },
        getItem: (itemId: string) => {
            return axios.get(`http://localhost:3232/api/items/${itemId}`).then((res) => res.data);
        },
        changeOrderDeliveryStatus: (orderId: number, deliveryStatus: string) => {
            return axios.post(`http://localhost:3232/api/orders/${orderId}/changeOrderDeliveryStatus`, {
                deliveryStatus: deliveryStatus
            }).then((res) => res.data);
        },
        getOrderLines: (orderId: number) => {
            return axios.get(`http://localhost:3232/api/orders/${orderId}/getOrderLines`).then((res) => res.data);
        },
        getOrderCount: (searchText: string, deliveryFilter: string, paymentFilter: string) => {
            return axios.get(`http://localhost:3232/api/orders/getOrderCount`, {
                params: {
                    searchText: searchText,
                    deliveryFilter: deliveryFilter,
                    paymentFilter: paymentFilter
                }
            }).then((res) => res.data.length)
        },
        listenToChanges: (syncPoint) => {
            return axios.get('/api/listenToChanges').then((res) => res.data);
        }
    }
}

