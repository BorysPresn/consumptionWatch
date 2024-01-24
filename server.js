const express = require ('express');
const app = express();
const PORT = process.env.PORT || 3000; 
app.use(express.json());

const { connectToDatabase, insertMileageRecord, getAllMileageRecords, getLastMileageRecord } = require('./database');
const { calculateMileageData } = require('./calculator');
    
// Эндпоинт для создания записи о пробеге
app.post('/mileage', async (req, res) => {
    try {
      const record = req.body;
      const result = await insertMileageRecord(record);
      
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Эндпоинт для получения всех записей о пробеге
  app.get('/mileage', async (req, res) => {
    try {
      const records = await getAllMileageRecords();
      res.json(records);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  




app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
  