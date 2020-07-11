const urlParams = new URLSearchParams(location.search);
const transactionID = urlParams.get('transactionID');

export { transactionID }
