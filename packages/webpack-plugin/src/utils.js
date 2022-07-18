const { getStyledMessage } = require('@prerender-kit/tools');

const getCompilationTimeMessage = (startTime, finishedWithError) => {
    const { red, green } = getStyledMessage;
    const endTime = new Date().getTime();
    const compilationTime = endTime - startTime;

    const minutes = Math.floor((compilationTime / 1000 / 60) << 0);
    const seconds = Math.floor((compilationTime / 1000) % 60);

    const stateMessage = finishedWithError ? red('finished with errors') : green('successfully finished');

    return `\nPrerendering process ${stateMessage} in ${compilationTime} ms (${minutes} min ${seconds} sec)\n`;
};

module.exports = {
    getCompilationTimeMessage
};
