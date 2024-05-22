require('dotenv').config({path: './config.env'})
const express = require ('express');
const app = express();
const PORT = process.env.PORT || 3000; 
app.use(express.json());
app.use(express.static('public'));


const {
  client,
  insertMileageRecord, 
  getAllMileageRecords, 
  getLastFullTankedRecord,
  getLatestMileageRecord, 
  getInitialMileage, 
  insertNewUser,
  checkUser
} = require('./database');
const { processData, updateStatistic, getStatistic } = require('./calculator.js');

// Endpoint for adding new record

app.post('/addRecord', async (req, res) => {
  try {
    const record = req.body;
    const userId = req.body.userId;
    const processedData = await processData(record, userId);
    if(processedData == null){
      res.status(500).json({ error : 'Error while data validating' });
      return;
    }
    console.log('processed data = ' + processedData)
    Object.keys(processedData).forEach( key => {
      if(processedData[key]) {
        // const insert = await insertMileageRecord(processedData);
        // if(!insert.success){
        //   throw new Error('Record inserting failed');
        // }
        console.log('elem', processedData[key]);
      }
    });
    
    
    delete processedData.userId;
    delete processedData._id;
    res.status(200).json(processedData);
  } catch (error) {
      console.error(error.message);
  }
});
  
//Endpoint for Register
app.post('/register', async (req, res) => {
  try {
    const record = req.body;
    console.log('server', record)
    const {success, message, userId, token, initialMileage} = await insertNewUser(record);
    if (success) {
      return res.status(200).json({ userId, token, initialMileage })
    }
    return res.status(400).json({ success, message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Endpoint for logIn
app.post('/login', async (req, res) => {
  try {
    const {success, message, userId, token, initialMileage} = await checkUser(req.body);
    
    if(success){
      res.status(200).json({ 
        message,
        userId,
        token,
        initialMileage
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
    const response = await getLatestMileageRecord(userId);
    if(response){
      delete response.userId;
      delete response._id;
      return res.status(200).json(response);
      
    } else {
      return res.status(400).json("no data");
    }
  } catch (error) {
    console.error(error)
    console.log(message);
    res.status(500).json({ error : 'Internal server error' });
  }
})

// getting initial mileage
app.get('/users', async (req, res)=> {
  try {
    const userId = req.query.userId;
    const initialMileage = await getInitialMileage(userId);
    if(initialMileage){
      res.status(200).json({initialMileage : initialMileage});
    } else {
      res.status(400).json('not found');
    }
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

//endpoint for generating statistic
app.get('./statistic', async (req, res) => {
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

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection');
  await client.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
  