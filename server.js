const express = require ('express');
const app = express();
const PORT = process.env.PORT || 3000; 
app.use(express.json());

const { 
  client,
  insertMileageRecord, 
  getAllMileageRecords, 
  getLastMileageRecord, 
  deleteAllMileageRecords, 
  getInitialMileage, 
  insertNewUser,
  checkUser} = require('./database');
const { processData, updateStatistic } = require('./calculator');
    
// Эндпоинт для создания записи о пробеге
app.post('/mileage', async (req, res) => {
  try {
      const record = req.body;
      const userId = req.body.userId;
      const initialData = await getInitialMileage(userId);
      const processedData = processData(record);
          
      await insertMileageRecord(processedData);

      const updatedStats = await updateStatistic(initialData.initialMileage);
      if(updatedStats.message === "No data"){
        res.status(200).json({message : "there's no data for statistics yet"})
      } else {
        res.status(200).json(updatedStats);
      }
      
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
  
app.post('/register', async (req, res) => {
  try {
    const record = req.body;
    const result = await insertNewUser(record);
    res.status(200).json({userId : result, status : 'succes!'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const result = await checkUser(req.body);
    if(result.message === "ok"){
      res.status(200).json({userId : result.userId});
    } else {
      res.status(400).json({error : result.message})
    }
    
  } catch (error) {
    console.error('Error in /login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/users', async (req, res)=> {
  try {
    const userId = req.body.userId;
    console.log(userId);
    const record = await getInitialMileage(userId);
    res.json(record);
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
  