import { loadStripe } from '@stripe/stripe-js';
import StripePaymentElement from "./StripePaymentElement";
// import StripeCompleted from "./StripeCompleted";
import './stripe.scss';

/**
 * Stripe is a module for testing stripe payments.
 */
class Stripe {
	constructor(app, params) {
		this.app = app;

		this.app.require([
			'auth',
			'api',
		], this._init.bind(this));
	}

	_init(module) {
		this.module = Object.assign({ self: this }, module);

		// this.stripe = null;

		// if (this.params.status == 'payment') {
		// 	this.module.auth.getUserPromise().then(user => {
		// 		return this.module.api.get('payment.info').then(info => {
		// 			if (this.params.status == 'redirect') {
		// 				this.component = new StripeCompleted(this.module, user, info);
		// 				this.module.screen.setComponent(this.component);
		// 				return;
		// 			}
		// 			return this._createSubscription(user, info);
		// 		});
		// 	});
		// }
	}

	createPayment(offerId) {
		return this.module.auth.getUserPromise()
			.then(user => this.module.api.call('payment.user.' + user.id + '.stripe', 'createPayment', {
				offerId,
			}));
	}

	newCardPaymentPromise(paymentId, opt) {
		let api = this.module.api;
		let info = null;
		let payment = null;
		return Promise.all([
			this.module.auth.getUserPromise(),
			api.get('payment.info').then(o => {
				info = o;
				o?.on();
				return o;
			}),
			api.get('payment.payment.' + paymentId).then(o => {
				payment = o;
				o?.on();
				return o;
			}),
			api.call('payment.payment.' + paymentId, 'getStripeIntent'),
		]).then(result => {
			let [ user, info, payment, intent ] = result;
			return this._createPaymentElement(user, info, payment, intent, opt);
		}).finally(() => {
			info?.off();
			payment?.off();
		});
	}

	_createPaymentElement(user, info, payment, intent, opt) {
		return loadStripe(info.stripePublicKey, {
			apiVersion: info.stripeApiVersion,
		}).then(stripe => new StripePaymentElement(this.module, user, info, payment, stripe, intent, opt));
	}

	dispose() {
	}
}

export default Stripe;
