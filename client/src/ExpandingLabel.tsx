import React, {Component} from 'react';
import {createApiClient, Order, Item, OrderLine} from './api';
import './ExpandingLabel.scss';


interface IProps {
    order: Order
}

interface IState {
    displayedText: string
    isClicked: boolean,
    items?: OrderLine[]
}

const api = createApiClient();

export class ExpandingLabel extends React.Component<IProps, IState> {
    public constructor(props: IProps) {
        super(props)
        this.state = {
            displayedText: 'Show items',
            isClicked: false
        }

        this.setState = this.setState.bind(this);
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
                {items.map((line) => (
                    <div>
                        <div className={'image'}><img src={line.item.image} alt={''}/></div>
                        <div className={'name'}>{line.item.name}</div>
                        <div className={'price'}>{line.item.price}$</div>
                    </div>
                ))}
            </div>
        )
    };
}


