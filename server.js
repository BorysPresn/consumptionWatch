const express = require ('express');
const app = express();
const PORT = process.env.PORT || 3000; 
app.use(express.json());

const { 
    insertMileageRecord, 
    getAllMileageRecords, 
    getLastMileageRecord, 
    deleteAllMileageRecords, 
    getInitialSettings, 
    insertInitialSettings } = require('./database');
const { processData, updateStatistic } = require('./calculator');
    
// Эндпоинт для создания записи о пробеге
app.post('/mileage', async (req, res) => {
    try {
        const record = req.body;
        const userId = req.body.userId;
        const initialData = await getInitialSettings(userId);
        const processedData = processData(record);
            
        await insertMileageRecord(processedData);

        const updatedStats = await updateStatistic(initialData.initialMileage);
        res.json(updatedStats);
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
  
app.post('/initialSetting', async (req, res) => {
    try {
        const record = req.body;
        const result = await insertInitialSettings(record);
        res.status(200).json({result});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.get('/initialSetting', async (req, res)=> {
    console.log(req.query);
    try {
        const userId = req.query.userId;
        const record = await getInitialSettings(userId);
        res.json(record);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
})


app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
  