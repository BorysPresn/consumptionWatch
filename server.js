const express = require ('express');
const app = express();
const PORT = process.env.PORT || 3000; 
app.use(express.json());
app.use(express.static('public'));


const { 
  client,
  insertMileageRecord, 
  getAllMileageRecords, 
  getLastMileageRecord, 
  deleteAllMileageRecords, 
  getInitialMileage, 
  insertNewUser,
  checkUser
} = require('./database');
const { processData, updateStatistic, getStatistic } = require('./calculator');
    
// Эндпоинт для создания записи о пробеге
app.post('/addMileage', async (req, res) => {
  try {
    const record = req.body;
    const userId = req.body.userId;
    const initialData = await getInitialMileage(userId);
    const processedData = processData(record);
        
    await insertMileageRecord(processedData);

    const updatedStats = await updateStatistic(initialData.initialMileage, userId);

    res.status(200).json(updatedStats);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
  
  // Эндпоинт для получения всех записей о пробеге
app.get('/history', async (req, res) => {
  const userId = req.query.userId;
  try {
    const records = await getAllMileageRecords(userId);
    if (!records.success){
      res.status(400).json({ records });
    }
    res.status(200).json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
  
app.post('/register', async (req, res) => {
  try {
    const record = req.body;
    console.log(record)
    const result = await insertNewUser(record);
    if (!result.success) {
      res.status(400).json({ result })
    }
    res.status(200).json({ result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const result = await checkUser(req.body);
    if(result.success){
      res.status(200).json({ result });
    } else {
      res.status(400).json({ result })
    }
  } catch (error) {
    console.error('Error in /login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/users', async (req, res)=> {
  try {
    const userId = req.query.userId;
    console.log(userId);
    const record = await getInitialMileage(userId);
    res.status(200).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection');
  await client.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
  