export const THEME_STORAGE_KEY = "ac_theme";

export const THEME_INIT_SCRIPT = `(function(){var t='light';try{t=localStorage.getItem('${THEME_STORAGE_KEY}')||'light';}catch(e){}var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',dark?'dark':'light');document.documentElement.style.colorScheme=dark?'dark':'light';})();`;
