import React from 'react';
import {createApiClient, Order} from './api';
import {OrderItems} from "./OrderItems";


interface Props {
    order: Order,
}
interface OrderComponentState{
    order:Order,
    displayingItems:boolean,
    displayedText:string
}

const api = createApiClient();

export class OrderComponent extends React.Component<Props, OrderComponentState> {
    public constructor(props: Props) {
        super(props);
        this.state= {
            order: props.order,
            displayingItems:false,
            displayedText:'Show items'
        }
        this.handleClicked = this.handleClicked.bind(this);
        this.toggleClicked = this.toggleClicked.bind(this);
    }

    render() {
        const order = this.props.order;
        return (
            <div className={'orderCard'}>
                <div className={'generalData'}>
                    <h6>{order.id}</h6>
                    <h4>{order.customer.name}</h4>
                    <h5>Order Placed: {new Date(order.createdDate).toLocaleDateString()}</h5>
                </div>
                <div className={'fulfillmentData'}>
                    <h4>{order.itemQuantity} Items</h4>
                    <img alt={''} src={OrderComponent.getAssetByStatus(order.fulfillmentStatus)}/>
                    {order.fulfillmentStatus !== 'canceled' &&
                    <a onClick={() => this.handleChangeDeliveryStatus(order)}>Mark
                        as {order.fulfillmentStatus === 'fulfilled' ? 'Not Delivered' : 'Delivered'}</a>
                    }
                </div>
                <div className={'paymentData'}>
                    <h4>{order.price.formattedTotalPrice}</h4>
                    <img alt={''} src={OrderComponent.getAssetByStatus(order.billingInfo.status)}/>
                </div>
                <div className={'space'}/>
                <div className={'moreInfo'}>
                    <h4><a onClick={this.handleClicked}>{this.state.displayedText}</a></h4>
                    {this.state.displayingItems&&<OrderItems order={order}/>}
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
    handleClicked() {
        this.setState(this.toggleClicked);
    }

    toggleClicked(state: { displayingItems: boolean }) {
        let newText = (state.displayingItems) ? 'Show items' : 'Hide items';
        return {
            order: this.state.order,
            displayedText: newText,
            displayingItems: !state.displayingItems,
        };
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