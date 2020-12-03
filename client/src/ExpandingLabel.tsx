import React, {Component} from 'react';
import {createApiClient, Order, Item} from './api';

interface IProps {
    order: Order
}

interface IState {
    isClicked: boolean,
    items?: Item[]
}

export class ExpandingLabel extends React.Component<IProps, IState> {
    public constructor(props: IProps) {
        super(props)
        this.state = {
            isClicked: false,
        }

        this.setState = this.setState.bind(this);
        this.handleClicked = this.handleClicked.bind(this);
        this.toggleClicked = this.toggleClicked.bind(this);
    }


    handleClicked() {
        this.setState(this.toggleClicked);
    }

    toggleClicked(state: { isClicked: boolean }) {
        return {
            isClicked: !state.isClicked
        };
    }

    render() {
        return (
            <div>
                <h4
                    onClick={this.handleClicked}
                >
                    {this.props.order.itemQuantity} Items
                    {this.state.isClicked && <div>Hovering right now</div>}
                </h4>
            </div>
        );
    }

}

