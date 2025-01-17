import { Txt, Elem } from 'modapp-base-component';
import isComponent from 'utils/isComponent';
import './tooltip.scss';

/**
 * Tooltip render a tooltip in the containing div.
 */
class Tooltip {

	/**
	 * Creates an instance of Tooltip
	 * @param {string|LocaleString|Component} text Tip to show on click.
	 * @param {Element} ref Reference element.
	 * @param {object} [opt] Optional parameters.
	 * @param {string} [opt.className] Class name for tooltip element.
	 * @param {string} [opt.margin] Margin to use. May be 'm'.
	 * @param {string} [opt.size] Size. May be 'auto' or 'full'. Default to 'auto'.
	 * @param {number} [opt.position] Position of caret in pixels relative to viewport. Centered if omitted.
	 * @param {function} [opt.onClose] Callback called on close.
	 */
	constructor(text, ref, opt) {
		opt = opt || {};
		opt.className = 'tooltip' + (opt.className ? ' ' + opt.className : '') + (opt.margin ? ' tooltip--margin-' + opt.margin : '');

		this._close = this._close.bind(this);
		this.opt = opt;
		this.ref = ref || window.document.body;
		this.txt = isComponent(text) ? text : new Txt(text, { className: 'tooltip--text' });
		this.elem = null;
		this.caret = null;
	}

	/**
	 * Opens the tooltip due a click.
	 * @param {boolean} open Flag that tells the tooltip is opened and not just hovered.
	 * @returns {this}
	 */
	open(open) {
		this.elem = new Elem(n => n.elem('div', this.opt, [
			n.component(this.txt),
		]));
		this.caret = new Elem(n => n.elem('div', { className: 'tooltip--caret' }));
		this.elem.render(this.ref);
		this.caret.render(this.ref);
		// this._setListeners(true);
		this._setPosition();
		this.open = open;
		return this;
	}

	setText(txt) {
		txt = this.txt.setText(txt);
		return this;
	}

	_setPosition() {
		if (!this.elem || !this.elem.getElement()) return;

		this.elem.removeClass('tooltip--full');
		this.elem.removeClass('tooltip--right');
		this.elem.removeClass('tooltip--left');
		this.elem.setStyle('margin-top', null);
		this.elem.setStyle('margin-left', null);
		let el = this.elem.getElement();
		let width = el.offsetWidth;
		this.elem.addClass('tooltip--full');
		let contRect = el.getBoundingClientRect();
		let contWidth = el.offsetWidth;
		let refRect = this.ref.getBoundingClientRect();
		let refWidth = this.ref.offsetWidth;

		// Calculate the x offset where the caret should be placed using the ref
		// element as reference.
		let offset = refWidth / 2;
		if (typeof this.opt.position == 'number') {
			offset = Math.min(Math.max(this.opt.position - refRect.left, 0), refWidth - 1);
		}
		// Ensure the offset is well inside the container to prevent the caret
		// from being disconnected.
		offset = Math.min(Math.max(offset, contRect.left - refRect.left + 9), contRect.right - refRect.left - 10);

		if (width < contWidth && this.opt.size != 'full') {
			let contOffset = refRect.left - contRect.left + offset - (width / 2);
			this.elem.removeClass('tooltip--full');
			if (contOffset < 0) {
				this.elem.addClass('tooltip--left');
			} else if (contOffset + width >= contWidth) {
				this.elem.addClass('tooltip--right');
			} else {
				this.elem.setStyle('margin-left', (offset - (width / 2)) + 'px');
			}
		}
		this.elem.setStyle('margin-top', (-this.ref.offsetHeight) + 'px');

		// Caret positioning
		this.caret.setStyle('margin-top', (-this.ref.offsetHeight) + 'px');
		this.caret.setStyle('margin-left', offset + 'px');
	}

	close() {
		this._close();
	}

	_close(e) {
		if (!this.elem) return;

		let n = this.ref;
		if (e && e.target && n && n.contains(e.target)) {

			return;
		}

		// this._setListeners(false);
		this.elem.unrender();
		this.caret.unrender();
		if (this.opt.onClose) {
			this.opt.onClose(e);
		}
	}

	// _setListeners(on) {
	// 	let cb = on ? 'addEventListener' : 'removeEventListener';
	// 	document[cb]('keydown', this._close, true);
	// 	document[cb]('click', this._close, true);
	// }
}

export default Tooltip;
