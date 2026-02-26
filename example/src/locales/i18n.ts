import { createI18n, I18nOptions } from "vue-i18n"

import en from './json/en.json'
import jp from './json/ja.json'
// import zh from './json/zh.json'
import ko from './json/ko.json'
import tw from './json/zh-Hant.json'
import pt from './json/pt.json'
import de from './json/de.json'
import fr from './json/fr.json'
import es from './json/es.json'
import id from './json/id.json'
import vi from './json/vi.json'

export enum Language {
	en = "en",
	// zh = "zh",
	jp = "ja",
	ko = "ko",
	tw = "zh-Hant",
	pt = "pt",
	de = "de",
	fr = "fr",
	es = "es",
	id = "id",
	vi = "vi"
}

const messages = {
	[Language.en]: en,
	[Language.jp]: jp,
	[Language.ko]: ko,
	[Language.tw]: tw,
	[Language.pt]: pt,
	[Language.de]: de,
	[Language.fr]: fr,
	[Language.es]: es,
	[Language.id]: id,
	[Language.vi]: vi
} as I18nOptions["messages"]

const i18n = createI18n({
	legacy: false,
	locale: Language.tw,
	globalInjection: true,
	warnHtmlMessage: false,
	messages
})
export default i18n
