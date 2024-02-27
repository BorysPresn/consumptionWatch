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
  getInitialMileage, 
  insertNewUser,
  checkUser
} = require('./database');
const { processData, updateStatistic, getStatistic } = require('./calculator');

// Endpoint for adding new record

app.post('/addRecord', async (req, res) => {
  try {
    const record = req.body;
    const userId = req.body.userId;
    //const response = await getInitialMileage(userId);
    const processedData = processData(record);
    await insertMileageRecord(processedData);
    const lastRecord = await getLastMileageRecord(userId);
    // const { userId, _id, ...respToClient } = lastRecord;
    delete lastRecord.userId;
    delete lastRecord._id;
    res.status(200).json(lastRecord);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
  
  // Endpoint for getting all records

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

//Endpoint for Register
app.post('/register', async (req, res) => {
  try {
    const record = req.body;
    console.log(record)
    const {success, message, userId, token} = await insertNewUser(record);
    if (success) {
      res.status(200).json({ userId, token })
    }
    res.status(400).json({ success, message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Endpoint for logIn
app.post('/login', async (req, res) => {
  try {
    const {success, message, userId, token} = await checkUser(req.body);
    
    if(success){
      res.status(200).json({ 
        message,
        userId,
        token
       });
    } else {
      res.status(400).json({ success, message });
    }
  } catch (error) {
    console.error('Error in /login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Enpoint for getting last record 
app.get('/lastRecord', async (req, res) => {
  try {
    const userId = req.query.userId;
    const response = await getLastMileageRecord(userId);
    if(response){
      res.status(200).json(response);
    } else {
      res.status(400).json("no data");
    }
  } catch (error) {
    console.error(error)
    console.log(message);
    res.status(500).json({ error : 'Internal server error' });
  }
})

app.get('/users', async (req, res)=> {
  try {
    const userId = req.query.userId;
    const {success, message, data} = await getInitialMileage(userId);
    if(success){
      res.status(200).json({message, data});
    } else {
      res.status(400).json({success, message})
    }
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
  