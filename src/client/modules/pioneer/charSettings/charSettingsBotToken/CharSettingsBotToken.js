import CharSettingsBotTokenComponent from './CharSettingsBotTokenComponent';
import './charSettingsBotToken.scss';

/**
 * CharSettingsBotToken adds a tool to PageCharSettings to create bot tokens.
 */
class CharSettingsBotToken {
	constructor(app, params) {
		this.app = app;

		this.app.require([
			'login',
			'api',
			'pageCharSettings',
			'toaster',
			'confirm',
		], this._init.bind(this));
	}

	_init(module) {
		this.module = Object.assign({ self: this }, module);

		this.module.pageCharSettings.addTool({
			id: 'botToken',
			type: 'sections',
			sortOrder: 30,
			componentFactory: (char, charSettings, state) => new CharSettingsBotTokenComponent(this.module, char, charSettings, state),
		});
	}

	dispose() {
		this._listen(false);
		this.module.pageCharSettings.removeTool('botToken');
	}
}

export default CharSettingsBotToken;
