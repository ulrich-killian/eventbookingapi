import sequelize from '../configs/sequelize.config.js';

const bookingModel = sequelize.define('booking', {
  // Define your model attributes here
});

export default bookingModel;