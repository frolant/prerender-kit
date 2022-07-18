const CONSOLE_STYLES = {
    default: '\x1b[0m',
    bold: '\u001b[1m',
    green: '\u001b[1m\u001b[32m',
    yellow: '\u001b[1m\u001b[33m',
    red: '\u001b[1m\u001b[31m'
};

const getStyledMessageItem = (text, color) => `${color}${text}${CONSOLE_STYLES.default}`;

const getStyledMessage = {
    bold: (text) => getStyledMessageItem(text, CONSOLE_STYLES.bold),
    green: (text) => getStyledMessageItem(text, CONSOLE_STYLES.green),
    yellow: (text) => getStyledMessageItem(text, CONSOLE_STYLES.yellow),
    red: (text) => getStyledMessageItem(text, CONSOLE_STYLES.red),
    warning: (text) => `${getStyledMessageItem('warning', CONSOLE_STYLES.yellow)} ${text}`,
    error: (text) => `${getStyledMessageItem('error', CONSOLE_STYLES.red)} ${text}`
};

module.exports = getStyledMessage;
