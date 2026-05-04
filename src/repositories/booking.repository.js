import bookingModel from '../models/booking.model.js';

const getAllData = async () => await bookingModel.findAll();

const getDataById = async (id) => await bookingModel.findOne({ where: { id } });

const createData = async (data) => await bookingModel.create(data);

const updateData = async (id, data) => {
  await bookingModel.update(data, { where: { id } });
  return await bookingModel.findOne({ where: { id } });
};

const deleteData = async (id) => {
  const data = await bookingModel.findOne({ where: { id } });
  await bookingModel.destroy({ where: { id } });
  return data;
};

export default { getAllData, getDataById, createData, updateData, deleteData };