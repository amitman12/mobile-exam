import React from 'react';
import './App.scss';
import {createApiClient, Order} from './api';
import {ExpandingLabel} from "./ExpandingLabel";
import InfiniteScroll from 'react-infinite-scroll-component';

export type AppState = {
    totalOrders?: number,
    page: number,
    orders?: Order[],
    search: string;
}


const api = createApiClient();

export class App extends React.PureComponent<{}, AppState> {

        state: AppState = {
            search: '',
            page: 1,
        };
        searchDebounce: any = null;

    async componentDidMount() {
        this.setState({
            orders: await api.getOrders(this.state.page)
        });
        this.setState({
            totalOrders: await api.getOrderCount()
        });
    }


    render() {
        const {orders} = this.state;
        return (
            <main>
                <h1>Orders</h1>
                <header>
                    <input type="search" placeholder="Search" onChange={(e) => this.onSearch(e.target.value)}/>
                </header>
                {orders ? <div className='results'>Showing {orders.length} results</div> : null}
                {orders ? this.renderOrders(orders) : <h2>Loading...</h2>}

            </main>
        )
    }

    renderOrders = (orders: Order[]) => {
        const filteredOrders = orders
            .filter((order) => (order.customer.name.toLowerCase() + order.id).includes(this.state.search.toLowerCase()));

        return (
            <div className='orders'>
                <InfiniteScroll next={this.fetchMoreData} hasMore={true} loader={<h4>Loading Data...</h4>}
                                dataLength={20*this.state.page} height={600}>
                    {filteredOrders.map((order) => (
                        <div className={'orderCard'}>
                            <div className={'generalData'}>
                                <h6>{order.id}</h6>
                                <h4>{order.customer.name}</h4>
                                <h5>Order Placed: {new Date(order.createdDate).toLocaleDateString()}</h5>
                            </div>
                            <div className={'fulfillmentData'}>
                                <h4>{order.itemQuantity} Items</h4>
                                <img src={App.getAssetByStatus(order.fulfillmentStatus)}/>
                                {order.fulfillmentStatus !== 'canceled' &&
                                <a onClick={() => this.handleChangeDeliveryStatus(order)}>Mark
                                    as {order.fulfillmentStatus === 'fulfilled' ? 'Not Delivered' : 'Delivered'}</a>
                                }
                            </div>
                            <div className={'paymentData'}>
                                <h4>{order.price.formattedTotalPrice}</h4>
                                <img src={App.getAssetByStatus(order.billingInfo.status)}/>
                            </div>
                            <div className={'space'}/>
                            <div className={'moreInfo'}>
                                <ExpandingLabel order={order}/>
                            </div>

                        </div>
                    ))}
                </InfiniteScroll>
            </div>
        )
    };

    fetchMoreData = async () => {
        const newPage = this.state.page + 1;
        this.setState({
                page: newPage,
                orders: this.state.orders?.concat(await api.getOrders(newPage)),
            });
            //app has more data when the user scrolls, since the array increases in size and is changed in memory.
            //make it so that less data is saved?
        }

    async handleChangeDeliveryStatus(order: Order) {
        const newFulfillmentStatus = (order.fulfillmentStatus === 'fulfilled') ? 'not-fulfilled' : 'fulfilled';
        await api.changeOrderDeliveryStatus(order.id, newFulfillmentStatus);
        // console.log((this.state.orders)?this.state.orders[0]:null)
        order.fulfillmentStatus = newFulfillmentStatus;
        const modifiedOrders = this.state.orders;
        console.log((modifiedOrders)?modifiedOrders.length:null);
        // console.log((this.state.orders)?this.state.orders[0]:null)

        this.setState({
            orders:modifiedOrders
        })
        // console.log((this.state.orders)?this.state.orders[0]:null)

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

    onSearch = async (value: string, newPage?: number) => {

        clearTimeout(this.searchDebounce);

        this.searchDebounce = setTimeout(async () => {
            this.setState({
                search: value
            });
        }, 300);
    };
}

//added code below

export default App;
