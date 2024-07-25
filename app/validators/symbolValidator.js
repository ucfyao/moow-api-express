const dateValidatorSchema = {
    start: {
      notEmpty: {
        errorMessage: 'Start Date is required'
      },
      isISO8601: {
        options: { strict: true, strictSeparator: true },
        errorMessage: 'Start Date must be in YYYY-MM-DD format'
      }
    },
    end: {
      notEmpty: {
        errorMessage: 'End Date is required'
      },
      isISO8601: {
        options: { strict: true, strictSeparator: true },
        errorMessage: 'End Date must be in YYYY-MM-DD format'
      },
      custom: {
        options: (value, { req }) => {
          const startDate = new Date(req.body.start);
          const endDate = new Date(value);
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid date format');
          }
          
          if (endDate <= startDate) {
            throw new Error('End Date must be after Start Date');
          }
          return true;
        }
      }
    }
  };
  
  module.exports = { dateValidatorSchema };