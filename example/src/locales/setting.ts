import { Language } from './i18n';

const LANGUAGE_KEY = 'language'
export const getLanguage = () => {
	return localStorage.getItem(LANGUAGE_KEY) || Language.en
}
export const setLanguage = (lang: string) => {
	localStorage.setItem(LANGUAGE_KEY, lang)
}
