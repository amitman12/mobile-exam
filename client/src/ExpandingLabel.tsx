import React, {Component} from 'react';
import {createApiClient, Order, Item, OrderLine} from './api';
import './ExpandingLabel.scss';


interface IProps {
    order: Order
}

interface IState {
    displayedText: string,
    isClicked: boolean,
    items?: OrderLine[]
}

const api = createApiClient();

export class ExpandingLabel extends React.Component<IProps, IState> {
    public constructor(props: IProps) {
        super(props);
        this.state = {
            displayedText: 'Show items',
            isClicked: false
        }

        this.handleClicked = this.handleClicked.bind(this);
        this.toggleClicked = this.toggleClicked.bind(this);
    }


    handleClicked() {
        this.setState(this.toggleClicked);
    }

    toggleClicked(state: { isClicked: boolean }) {
        let newText = (state.isClicked) ? 'Show items' : 'Hide items';
        return {
            displayedText: newText,
            isClicked: !state.isClicked,
        };
    }

    async componentDidMount() {
        this.setState({
            items: await api.getOrderLines(this.props.order.id)
        });
    }


    render() {
        const {items} = this.state;
        return (<div>
            <h4>
                <a onClick={this.handleClicked}>{this.state.displayedText}</a>
                {/*{this.state.isClicked && <div>text...</div>}*/}
                <div>{items && this.state.isClicked ? this.renderOrderLines(items) : null}</div>
            </h4>
        </div>);
    }


    renderOrderLines = (items: OrderLine[]) => {
        return (
            <div className={'itemCard'}>
                Exact order time: {this.props.order.createdDate}
                {items.map((line,index) => (
                    <div key={index}>
                        <div><img src={line.item.image} alt={''}/><h5>{line.item.name} {line.quantity} X {line.item.price}$</h5></div>
                        {/*<div className={'name'}></div>*/}
                        {/*<div className={'price'}>{line.quantity} X {line.item.price}$</div>*/}

                    </div>
                ))}
            </div>
        )
    };
}


