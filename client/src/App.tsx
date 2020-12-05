import React from 'react';
import './App.scss';
import {createApiClient, Order} from './api';
import InfiniteScroll from 'react-infinite-scroll-component';
import {OrderComponent} from "./OrderComponent";

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
            orders: await api.getOrders(this.state.search, this.state.page)
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
                                dataLength={20 * this.state.page} height={600}>
                    {orders.map((order) => (
                        <OrderComponent key={order.id} order={order}/>
                    ))}
                </InfiniteScroll>
            </div>
        )
    };

    fetchMoreData = async () => {
        const newPage = this.state.page + 1;
        this.setState({
            page: newPage,
            orders: this.state.orders?.concat(await api.getOrders(this.state.search, newPage)),
        });
        //app has more data when the user scrolls, since the array increases in size and is changed in memory.
        //make it so that less data is saved?
    }

    onSearch = async (value: string) => {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(async () => {
            this.setState({
                search: value,
                page:1,
                orders: await api.getOrders(value, 1)
            });
        }, 300);
        // this.setState({
        //     orders: await api.getOrders(value, 1)
        // })
    };
}


export default App;
