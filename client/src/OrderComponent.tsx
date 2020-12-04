import React, {Component} from 'react';
import {createApiClient, Order} from './api';
import {ExpandingLabel} from "./ExpandingLabel";


interface Props {
    order: Order
}

const api = createApiClient();

export class OrderComponent extends React.Component<Props> {
    public constructor(props: Props) {
        super(props);
        this.state = {
            order: props.order
        }
    }

    render() {
        const order = this.props.order
        return (
            <div className={'orderCard'}>
                <div className={'generalData'}>
                    <h6>{order.id}</h6>
                    <h4>{order.customer.name}</h4>
                    <h5>Order Placed: {new Date(order.createdDate).toLocaleDateString()}</h5>
                </div>
                <div className={'fulfillmentData'}>
                    <h4>{order.itemQuantity} Items</h4>
                    <img src={OrderComponent.getAssetByStatus(order.fulfillmentStatus)}/>
                    {order.fulfillmentStatus !== 'canceled' &&
                    <a onClick={() => this.handleChangeDeliveryStatus(order)}>Mark
                        as {order.fulfillmentStatus === 'fulfilled' ? 'Not Delivered' : 'Delivered'}</a>
                    }
                </div>
                <div className={'paymentData'}>
                    <h4>{order.price.formattedTotalPrice}</h4>
                    <img src={OrderComponent.getAssetByStatus(order.billingInfo.status)}/>
                </div>
                <div className={'space'}/>
                <div className={'moreInfo'}>
                    <ExpandingLabel order={order}/>
                </div>
            </div>
        )
    }

    async handleChangeDeliveryStatus(order: Order) {
        const newFulfillmentStatus = (order.fulfillmentStatus === 'fulfilled') ? 'not-fulfilled' : 'fulfilled';
        await api.changeOrderDeliveryStatus(order.id, newFulfillmentStatus);
        order.fulfillmentStatus = newFulfillmentStatus;
        this.setState({
            order: order
        })
    }

    static getAssetByStatus(status: string) {
        switch (status) {
            case 'fulfilled':
                return require('./assets/package.png');
            case 'not-fulfilled':
                return require('./assets/pending.png');
            case 'canceled':
                return require('./assets/cancel.png');
            case 'paid':
                return require('./assets/paid.png');
            case 'not-paid':
                return require('./assets/not-paid.png');
            case 'refunded':
                return require('./assets/refunded.png');
        }
    }
}