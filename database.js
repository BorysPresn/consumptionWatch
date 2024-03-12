const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://boryspresniak:Anubag7981MongoDB@cluster0.ub2nw6k.mongodb.net/?retryWrites=true&w=majority";
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const secretKey = 'this_is_a_very_secret_key';
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

async function connectToDatabase() {
    try {
      await client.connect();
      console.log('Connected to MongoDB');
      return client.db("consumptionDB");
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
}

async function insertMileageRecord(record) {
  const db = await connectToDatabase();
  const mileageCollection = db.collection('mileage');
  try {
      const result = await mileageCollection.insertOne(record);
      return {
        success : true,
        message : "Record successfully inserted",
        data : { result }
      };
  } catch (error) {
      console.error("Error during inserting operation", error);
      throw error;
  }
}

async function getAllMileageRecords(userId) {
    const db = await connectToDatabase();
    const mileageCollection = await db.collection('mileage').find({ userId : userId }).toArray();
    if (!mileageCollection) {
      return { success : false, message : "User not found" };
    }
    console.log(mileageCollection)
    return {success : true, message : "succes", data : mileageCollection}
}

async function getLastMileageRecord(id) {
    const db = await connectToDatabase();
    const mileageCollection = db.collection('mileage');
    // Замените на ваш фактический запрос для получения последней записи
    return mileageCollection.findOne({userId : id}, { sort: { _id: -1 } });
}

async function insertNewUser(record) {
  const {email, password, initialMileage} = record;
  console.log(email, password, initialMileage)
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');
  try {
    // console.log('Hashing password:', record.password, 'with salt rounds:', saltRounds);
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const alreadyExists = await usersCollection.findOne({email: email});
    if(alreadyExists){
      return ({success : false, message : "This e-mail already exists"});
    }
    const result = await usersCollection.insertOne({
      ...record,
      password : hashedPassword
    });
    const user = await usersCollection.findOne({email: email});
    console.log('user after inserting', user)
    const token = jwt.sign({ userId: user._id, email: user.email }, secretKey, { expiresIn: '1h' });
    return {
      success : true, 
      message : "User registered successfully", 
      userId : result.insertedId, 
      token : token,
      initialMileage : user.initialMileage 
    };
  } catch (error) {
      console.error(error);
      throw error;
  }
}

async function checkUser(userToFind) {
  try {
    const db = await connectToDatabase();
    const usersCollection = await db.collection('users');
    const { email, password } = userToFind;
    const user = await usersCollection.findOne({email : email});
    
    if(!user){
      return { 
        success : false, 
        message : 'E-mail is wrong' 
      };
    } 
    const checkPass = await bcrypt.compare(password, user.password);

    if(!checkPass) {
      return { 
        success : false, 
        message : 'Password is wrong' 
      };
    };
    const token = jwt.sign({ userId: user._id, email: user.email }, secretKey, { expiresIn: '1h' });

    return { 
      success : true, 
      message : "Login successful", 
      userId : user._id, 
      token : token ,
      initialMileage: user.initialMileage 
    };
  } catch (error) {
    console.error('Error in checkUser:', error);
    throw new Error('Error checking user');
  }
 
}

async function getInitialMileage(id) {
  try{
    // console.log('this is an UserId : ', typeof id)
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id : new ObjectId(id) });
    if(!user){
      return  null;
    }
    return user.initialMileage;
  } catch (error) {
    console.error('Error in getInitialMileage:', error);
    throw new Error('Error getting initial mileage');
  }
}


module.exports = {
  client, 
  connectToDatabase, 
  insertMileageRecord, 
  getAllMileageRecords, 
  getLastMileageRecord, 
  // deleteAllMileageRecords, 
  getInitialMileage,
  insertNewUser,
  checkUser
};