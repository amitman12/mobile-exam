import React from 'react';
import {createApiClient, Order, OrderLine} from './api';
import './OrderItems.scss';


interface IProps {
    order: Order
}

interface IState {
    displayedText: string,
    isClicked: boolean,
    items?: OrderLine[]
}

const api = createApiClient();

export class OrderItems extends React.Component<IProps, IState> {
    public constructor(props: IProps) {
        super(props);
        this.state = {
            displayedText: 'Show items',
            isClicked: false
        }
    }

    async componentDidMount() {
        this.setState({
            items: await api.getOrderLines(this.props.order.id)
        });
    }

    render() {
        const {items} = this.state;
        return (
            <div>{items ? this.renderOrderLines(items) : null}</div>
        );
    }


    renderOrderLines = (items: OrderLine[]) => {
        return (
            <div className={'itemCard'}>
                <h5>Exact order time: {this.props.order.createdDate}</h5>
                {items.map((line, index) => (
                    <div key={index}>
                        <div><img src={line.item.image} alt={''}/>
                            <h5>{line.item.name} {line.quantity} X {line.item.price}$</h5></div>
                    </div>
                ))}
            </div>
        )
    };
}


