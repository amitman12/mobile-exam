import React from 'react';
import './App.scss';
import {createApiClient, Order} from './api';
import InfiniteScroll from 'react-infinite-scroll-component';
import {OrderComponent} from "./OrderComponent";
import {FormControl, FormLabel, RadioGroup, FormControlLabel, Radio} from '@material-ui/core'


export type AppState = {
    totalOrders?: number,
    page: number,
    orders?: Order[],
    paymentStatusFilter: string,
    deliveryStatusFilter: string,
    search: string,
    changedOrders?: Order[],
    syncPoint: number
}


const api = createApiClient();

export class App extends React.PureComponent<{}, AppState> {

    state: AppState = {
        search: '',
        page: 1,
        deliveryStatusFilter: 'All',
        paymentStatusFilter: 'All',
        syncPoint: 0
    };
    searchDebounce: any = null;
    started: boolean = false;

    async initClient() {

        let syncPoint: number = 0;
        while (true) {
            if (!this.state.orders) {
                //sleep 2 seconds here.
            } else {
                let waitForOrderChangesResponse = await api.listenToChanges(syncPoint);
                let changedOrders = waitForOrderChangesResponse.changedOrders;
                syncPoint = waitForOrderChangesResponse.syncPoint;
                let updatedOrders = [...this.state.orders];
                let i = 0;
                while (i < changedOrders.length) {
                    let j = 0;
                    while (j < updatedOrders.length) {
                        if (updatedOrders[j].id === changedOrders[i].id) {
                            console.log("handled");
                            updatedOrders[j].fulfillmentStatus = changedOrders[i].fulfillmentStatus;
                        }
                        ++j;
                    }
                    ++i;
                }
                console.log(updatedOrders);
                this.setState({
                    orders: updatedOrders
                });
            }
        }
    }

    async componentDidMount() {
        this.setState({
            orders: await api.getOrders(this.state.search, this.state.page, this.state.deliveryStatusFilter, this.state.paymentStatusFilter)
        });
        this.setState({
            totalOrders: await api.getOrderCount(this.state.search, this.state.deliveryStatusFilter, this.state.paymentStatusFilter)
        });
        if (!this.started) {
            this.started = true;
            this.initClient();
        }
    }


    render() {
        const {orders} = this.state;
        return (
            <main>
                <h1>Orders</h1>
                <header>
                    <input type="search" placeholder="Search" onChange={(e) => this.onSearch(e.target.value)}/>
                </header>
                <div>
                    <span>
                        <h5>
                        <FormControl component="fieldset">
                            <FormLabel component="legend"/>
                            <RadioGroup row aria-label="Delivery Status" name="Delivery Status"
                                        value={this.state.deliveryStatusFilter}
                                        onChange={(e) => this.handleDeliveryStatusFilterChange(e)}>
                                <FormControlLabel value="All" control={<Radio/>} label="All"/>
                                <FormControlLabel value="Delivered" control={<Radio/>} label="Delivered"/>
                                <FormControlLabel value="Not Delivered" control={<Radio/>} label="Not Delivered"/>
                            </RadioGroup>
                        </FormControl>
                        </h5>
                        <h5>
                        <FormControl component="fieldset">
                            <FormLabel component="legend"/>
                            <RadioGroup row aria-label="Delivery Status" name="Delivery Status"
                                        value={this.state.paymentStatusFilter}
                                        onChange={(e) => this.handlePaymentStatusFilterChange(e)}>
                                <FormControlLabel value="All" control={<Radio/>}
                                                  label="All"/>
                                <FormControlLabel value="Paid" control={<Radio/>} label="Paid"/>
                                <FormControlLabel value="Not Paid" control={<Radio/>} label="Not Paid"/>
                            </RadioGroup>
                        </FormControl>
                            </h5>
                    </span>
                </div>


                {orders ?
                    <div className='results'>Showing {orders.length} / {this.state.totalOrders} results</div> : null}
                {orders ? this.renderOrders(orders) : <h2>Loading...</h2>}

            </main>
        )
    }

    renderOrders = (orders: Order[]) => {
        return (
            <div className='orders'>
                <InfiniteScroll next={this.fetchMoreData} hasMore={true} loader={<h4>Loading Data...</h4>}
                                dataLength={20 * this.state.page} height={600}>
                    {orders.map((order) => (
                        <OrderComponent key={order.id} order={order}/>
                    ))}
                </InfiniteScroll>
            </div>
        )
    };

    handleDeliveryStatusFilterChange = async (ev: any) => {
        const val = ev.target.value;
        this.setState({
            deliveryStatusFilter: val,
            page: 1,
            orders: await api.getOrders(this.state.search, 1, val, this.state.paymentStatusFilter),
            totalOrders: await api.getOrderCount(this.state.search, val, this.state.paymentStatusFilter)
        });
    };
    handlePaymentStatusFilterChange = async (ev: any) => {
        const val = ev.target.value;
        this.setState({
            paymentStatusFilter: val,
            page: 1,
            orders: await api.getOrders(this.state.search, 1, this.state.deliveryStatusFilter, val),
            totalOrders: await api.getOrderCount(this.state.search, this.state.deliveryStatusFilter, val)
        });
    };

    fetchMoreData = async () => {
        const newPage = this.state.page + 1;
        this.setState({
            page: newPage,
            orders: this.state.orders?.concat(await api.getOrders(this.state.search, newPage, this.state.deliveryStatusFilter, this.state.paymentStatusFilter)),
        });
        //app has more data when the user scrolls, since the array increases in size and is changed in memory.
        //make it so that less data is saved?
    }

    onSearch = async (value: string) => {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(async () => {
            this.setState({
                search: value,
                page: 1,
                orders: await api.getOrders(value, 1, this.state.deliveryStatusFilter, this.state.paymentStatusFilter),
                totalOrders: await api.getOrderCount(value, this.state.deliveryStatusFilter, this.state.paymentStatusFilter)
            });
        }, 300);
    };
}


export default App;
