import React from 'react';
import './App.scss';
import {createApiClient, Order} from './api';
import InfiniteScroll from 'react-infinite-scroll-component';
import {OrderComponent} from "./OrderComponent";
import {FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Box} from '@material-ui/core'
import {MuiThemeProvider, createMuiTheme} from '@material-ui/core/styles';

const theme = createMuiTheme({
    palette: {
        secondary: {main: '#d71111'},
        primary: {main: '#12e91c'},
    },
});

export type AppState = {
    totalOrders?: number,
    page: number,
    orders?: Order[],
    paymentStatusFilter: string,
    deliveryStatusFilter: string,
    search: string,
    changedOrders?: Order[],
    syncPoint: number,
    totalNotDeliveredOrders?: number
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


    wait(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async initClient() {
        let syncPoint: number = 0;
        while (true) {
            if (!this.state.orders) {
                await this.wait(2000);
            } else {
                try {
                    let waitForOrderChangesResponse = await api.listenToChanges(syncPoint);
                    let changedOrders = waitForOrderChangesResponse.changedOrders;
                    let notDeliveredCount = waitForOrderChangesResponse.notDeliveredCount;
                    syncPoint = waitForOrderChangesResponse.syncPoint;
                    let newOrdersArray = [...this.state.orders];
                    for (let order of changedOrders) {
                        for (let newOrder of newOrdersArray) {
                            if (newOrder.id === order.id) {
                                newOrder.fulfillmentStatus = order.fulfillmentStatus;
                            }
                        }
                    }
                    this.setState({
                        orders: newOrdersArray,
                        totalNotDeliveredOrders: notDeliveredCount
                    });
                } catch (err) {
                    console.log(err)
                    await this.wait(2000);
                }
            }
        }
    }

    async componentDidMount() {
        this.setState({
            orders: await api.getOrders(this.state.search, this.state.page, this.state.deliveryStatusFilter, this.state.paymentStatusFilter)
        });
        this.setState({
            totalOrders: await api.getOrderCount(this.state.search, this.state.deliveryStatusFilter, this.state.paymentStatusFilter),
            totalNotDeliveredOrders: await api.getOrderCount('', 'Not Delivered', 'All')
        });
        if (!this.started) {
            this.started = true;
            this.initClient(); // no await
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
                        <MuiThemeProvider theme={theme}>
                        <h5>
                        <FormControl component="fieldset">
                            <FormLabel component="legend"/>
                            <RadioGroup row aria-label="Delivery Status" name="Delivery Status"
                                        value={this.state.deliveryStatusFilter}
                                        onChange={(e) => this.handleDeliveryStatusFilterChange(e)}>
                                <FormControlLabel value="All" control={<Radio color={"primary"}/>}
                                                  label={<Box component="div" fontSize={14}>All</Box>}/>
                                <FormControlLabel value="Delivered" control={<Radio color={"primary"}/>}
                                                  label={<Box component="div" fontSize={14}>Delivered</Box>}/>
                                <FormControlLabel value="Not Delivered" control={<Radio color={"secondary"}/>}
                                                  label={<Box component="div" fontSize={14}>Not Delivered</Box>}/>
                            </RadioGroup>
                        </FormControl>
                        </h5>
                        <h5>
                        <FormControl component="fieldset">
                            <FormLabel component="legend"/>
                            <RadioGroup row aria-label="Delivery Status" name="Delivery Status"
                                        value={this.state.paymentStatusFilter}
                                        onChange={(e) => this.handlePaymentStatusFilterChange(e)}>
                                <FormControlLabel value="All" control={<Radio color={"primary"}/>}
                                                  label={<Box component="div" fontSize={14}>All</Box>}/>
                                <FormControlLabel value="Paid" control={<Radio color={"primary"}/>}
                                                  label={<Box component="div" fontSize={14}>Paid</Box>}/>
                                <FormControlLabel value="Not Paid" control={<Radio color={"secondary"}/>}
                                                  label={<Box component="div" fontSize={14}>Not Paid</Box>}/>
                            </RadioGroup>
                        </FormControl>
                            </h5>
                        </MuiThemeProvider>
                </span>
                </div>
                <div></div>

                {
                    orders ?
                        <div className='results'>
                            <div className='searchResults'>Showing {orders.length} / {this.state.totalOrders} results </div>
                            <div className='totalNotDelivered'>(total not delivered: {this.state.totalNotDeliveredOrders})</div>
                        </div> : null
                }
                {
                    orders ? this.renderOrders(orders) : <h2>Loading...</h2>
                }

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
