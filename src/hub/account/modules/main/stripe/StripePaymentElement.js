import { Elem, Html, Txt, Input } from 'modapp-base-component';
import { ModelTxt } from 'modapp-resource-component';
import { Model } from 'modapp-resource';
import l10n from 'modapp-l10n';
import Collapser from 'components/Collapser';
import FAIcon from 'components/FAIcon';
import LabelToggleBox from 'components/LabelToggleBox';
import formatDate from 'utils/formatDate';
import escapeHtml from 'utils/escapeHtml';
import * as txtRecurrence from 'utils/txtRecurrence';
import * as txtCurrency from 'utils/txtCurrency';

const paymentUrl = HUB_PATH + 'policy/payment.html';
const txtPaymentTermsAgreement = l10n.l('stripe.paymentTermsAgreement', `I agree to Mucklet's <a href="{paymentUrl}" class="link" target="_blank">payment terms</a>.`, { paymentUrl: escapeHtml(paymentUrl) });

/**
 * StripePaymentElement draws a component that tests accepting a payment using
 * the stripe Payment element
 */
class StripePaymentElement {
	constructor(module, user, info, payment, stripe, intent, opt) {
		this.module = module;
		this.user = user;
		this.info = info;
		this.payment = payment;
		this.stripe = stripe;
		this.intent = intent;
		this.offer = payment.offer;
		this.opt = opt || {};

		this.payPromise = null;
		this.paymentElement = null;

		this.info.on();
		this.payment.on();
	}

	render(el) {
		let model = new Model({ data: { agree: false }, eventBus: this.module.self.app.eventBus });

		this.elem = new Elem(n => n.elem('div', { className: 'stripe' + (this.opt.className ? ' ' + this.opt.className : '') }, [
			n.component(this.opt.includeName
				? new Elem(n => n.elem('div', [
					n.elem('label', { attributes: { for: 'stripe-cardholder' }}, [
						n.component(new Txt(l10n.l('stripe.cardholder', "Cardholder"), { tagName: 'h3' })),
					]),
					n.component('cardholder', new Input('', {
						className: 'stripe--input',
						attributes: { placeholder: "Name on card", id: 'stripe-cardholder', spellcheck: 'false' },
					})),
				]))
				: null,
			),
			n.elem('div', { className: 'stripe--payment' }, [
				n.elem('payment', 'div'),
			]),
			n.elem('div', { className: 'stripe--termsinfo' }, [
				n.elem('div', [
					n.component(this.intent.intentType == 'setup'
						? new ModelTxt(this.payment, m => m.periodEnd
							? l10n.l('stripe.firstPayment', "First payment {date}. ", { date: formatDate(new Date(m.periodEnd), { showYear: true }) })
							: '',
						)
						: null,
					),
					n.component(new ModelTxt(this.offer, m => txtRecurrence.info(m.recurrence))),
				]),
			]),
			n.component(new LabelToggleBox(
				new Html(txtPaymentTermsAgreement, { className: 'stripe--agree' }),
				model.agree,
				{
					className: 'common--formmargin ',
					onChange: v => model.set({ agree: v }),
				},
			)),
			n.component('message', new Collapser(null)),
			n.elem('stripe', 'button', { events: {
				click: (c, ev) => {
					ev.preventDefault();
					this._onPay(model);
				},
			}, className: 'btn large primary stripe--pay pad-top-xl stripe--btn' }, [
				n.elem('spinner', 'div', { className: 'spinner spinner--btn fade hide' }),
				n.component(new FAIcon('credit-card')),
				n.component(this.intent.intentType == 'payment'
					? new Elem(n => n.elem('span', [
						n.component(new Txt(l10n.l('stripe.pay', "Pay"))),
						n.text(" "),
						n.component(new ModelTxt(this.offer, m => txtCurrency.toLocaleString(m.currency, m.cost))),
					]))
					: new Txt(l10n.l('stripe.subscribe', "Subscribe")),
				),
			]),
		]));
		let rel = this.elem.render(el);
		// Mount stripe card element
		this.elements = this.stripe.elements({
			clientSecret: this.intent.clientSecret,
			locale: 'en',
			fonts: [
				{ cssSrc: '/fonts/fonts.css' },
			],
			appearance: {
				theme: 'flat',
				variables: {
					colorPrimary: '#c1a657', // $color2
					colorBackground: '#303753', // $color1-lightest
					colorText: '#fffcf2', // $color3
					colorDanger: '#9a593e', // $log-error
					colorTextPlaceholder: '#676c82', // $color1-placeholder-light
					colorTextSecondary: '#93969f', // $color4
					colorIcon: '#fffcf2', // $color3
					fontSizeBase: '16px', // $font-size
					fontFamily: 'Open Sans, sans-serif',
					spacingUnit: '2px',
					borderRadius: '4px',
					fontLineHeight: '20px',
				},
				rules: {
					'.Input': {
						lineHeight: '20px',
					},
					'.Label': {
						fontFamily: 'Amatic SC, cursive',
						fontSize: '24px',
						fontWeight: 'bold',
						color: '#c1a657', // $color2
					},
					'.Error': {
						paddingTop: '4px',
					},
				},
			},
		});
		this.paymentElement = this.elements.create('payment', {
			fields: {
				billingDetails: {
					name: this.opt.includeName ? 'never' : 'auto',
				},
			},
		});
		this.paymentElement.mount(this.elem.getNode('payment'));

		return rel;
	}

	unrender() {
		if (this.elem) {
			this.paymentElement.unmount();
			this.elem.unrender();
			this.elem = null;
			this.paymentElement = null;
		}
	}

	dispose() {
		this.unrender();
		this.info.off();
		this.payment.off();
	}

	_onPay(model) {
		if (!this.paymentElement || this.payPromise) return;

		if (!model.agree) {
			this._setMessage(l10n.l('stripe.mustAgree', "You must agree to the payment terms."));
			return;
		}

		let billing_details = {};

		if (this.opt.includeName) {
			let cardholder = this.elem.getNode('cardholder').getValue().trim();
			if (!cardholder) {
				this._setMessage(l10n.l('stripe.missingCardholder', "Missing cardholder name."));
				return;
			}
			billing_details.name = cardholder;
		}

		// Clear any previous message
		this._setMessage();

		this.elem.removeNodeClass('spinner', 'hide');

		let url = typeof this.opt.returnUrl == 'function'
			? this.opt.returnUrl(this.payment.id)
			: this.opt.returnUrl || window.location.href;

		this.payPromise = (this.intent.intentType == 'payment'
			? this.stripe.confirmPayment({
				elements: this.elements,
				confirmParams: {
					return_url: url,
					payment_method_data: {
						billing_details,
					},
				},
			})
			: this.stripe.confirmSetup({
				elements: this.elements,
				confirmParams: {
					return_url: url,
					payment_method_data: {
						billing_details,
					},
				},
			})
		).then(result => {
			if (result.error) {
				console.error(result.error);
				return Promise.reject({ code: 'stripe.error', message: result.error.message });
			}
			if (this.opt.onSuccess) {
				this.opt.onSuccess(result.paymentIntent);
			} else {
				let n = this.elem.getNode('message');
				n.setComponent(new Txt(l10n.l('stripe.successfulPayment', "Payment was successful")));
			}
		}).catch(err => {
			this._setMessage(l10n.l(err.code, err.message, err.data));
		}).then(() => {
			this.payPromise = null;
			this.elem.addNodeClass('spinner', 'hide');
		});

	}

	_setMessage(msg) {
		if (!this.elem) return;
		let n = this.elem.getNode('message');
		n.setComponent(msg ? new Txt(msg, { className: 'stripe--error' }) : null);
	}
}

export default StripePaymentElement;
