import { createRequestSender } from '@bigcommerce/request-sender';
import { Observable } from 'rxjs';

import { CartRequestSender } from '../cart';
import { getCart } from '../cart/carts.mock';
import { getErrorResponse, getResponse } from '../common/http-request/responses.mock';

import CheckoutActionCreator from './checkout-action-creator';
import { CheckoutActionType } from './checkout-actions';
import CheckoutRequestSender from './checkout-request-sender';
import { getCheckout } from './checkouts.mock';

describe('CheckoutActionCreator', () => {
    let checkoutRequestSender;
    let cartRequestSender;

    beforeEach(() => {
        checkoutRequestSender = new CheckoutRequestSender(createRequestSender());
        cartRequestSender = new CartRequestSender(createRequestSender());

        jest.spyOn(cartRequestSender, 'loadCarts')
            .mockReturnValue(Promise.resolve(getResponse([getCart()])));

        jest.spyOn(checkoutRequestSender, 'loadCheckout')
            .mockReturnValue(Promise.resolve(getResponse(getCheckout())));
    });

    it('emits action to notify loading progress', async () => {
        const actionCreator = new CheckoutActionCreator(checkoutRequestSender, cartRequestSender);
        const actions = await actionCreator.loadCheckout()
            .toArray()
            .toPromise();

        expect(actions).toEqual([
            { type: CheckoutActionType.LoadCheckoutRequested },
            { type: CheckoutActionType.LoadCheckoutSucceeded, payload: getCheckout() },
        ]);
    });

    it('emits error action if unable to load checkout', async () => {
        jest.spyOn(checkoutRequestSender, 'loadCheckout')
            .mockReturnValue(Promise.reject(getErrorResponse()));

        const actionCreator = new CheckoutActionCreator(checkoutRequestSender, cartRequestSender);
        const errorHandler = jest.fn(action => Observable.of(action));

        const actions = await actionCreator.loadCheckout()
            .catch(errorHandler)
            .toArray()
            .toPromise();

        expect(errorHandler).toHaveBeenCalled();
        expect(actions).toEqual([
            { type: CheckoutActionType.LoadCheckoutRequested },
            { type: CheckoutActionType.LoadCheckoutFailed, error: true, payload: getErrorResponse() },
        ]);
    });
});
