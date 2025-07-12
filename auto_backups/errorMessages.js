export function addErreurMessage(res, key, errorMessage, refs) {
    if (!refs?.errorMessages)
        return;
    if (errorMessage) {
        res.errorMessage = {
            ...res.errorMessage,
            [key]: errorMessage,
        };
    }
}
export function setResponseValueAndErreurs(res, key, value, errorMessage, refs) {
    res[key] = value;
    addErreurMessage(res, key, errorMessage, refs);
}
