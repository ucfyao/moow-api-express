const submitPurchaseValidatorSchema = {
  eth_address: {
    notEmpty: { errorMessage: 'eth_address is required' },
    isString: { errorMessage: 'eth_address must be a string' },
  },
  tx_hash: {
    notEmpty: { errorMessage: 'tx_hash is required' },
    isString: { errorMessage: 'tx_hash must be a string' },
  },
  amount: {
    notEmpty: { errorMessage: 'amount is required' },
    isString: { errorMessage: 'amount must be a string' },
  },
};

module.exports = { submitPurchaseValidatorSchema };
