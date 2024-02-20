const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://boryspresniak:Anubag7981MongoDB@cluster0.ub2nw6k.mongodb.net/?retryWrites=true&w=majority";
const bcrypt = require('bcrypt');
const saltRounds = 10;
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
    const mileageCollection = db.collection('mileage').find({ _id : userId }).toArray();
    if (!mileageCollection) {
      return { success : false, message : "User not found" };
    }
    return {success : true, message : "succes", data : mileageCollection}
}

async function getLastMileageRecord() {
    const db = await connectToDatabase();
    const mileageCollection = db.collection('mileage');
    // Замените на ваш фактический запрос для получения последней записи
    return mileageCollection.findOne({}, { sort: { _id: -1 } });
}

// async function deleteAllMileageRecords() {
//   const db = await connectToDatabase();
//   const mileageCollection = db.collection('mileage');

//   try {
//       const result = await mileageCollection.deleteMany({});
//       console.log(`${result.deletedCount} records deleted`);
//       return result.deletedCount;
//   } catch (error) {
//       console.error('Error during deleting records:', error);
//       throw error;
//   }
// }

async function insertNewUser(record) {
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');
  try {
    console.log('Hashing password:', record.password, 'with salt rounds:', saltRounds);
    const hashedPassword = await bcrypt.hash(record.password, saltRounds);
    const alreadyExists = await usersCollection.findOne({email: record.email})
    if(alreadyExists){
      return ({success : false, message : "This e-mail already exists"})
    }
    const result = await usersCollection.insertOne({
      ...record,
      password : hashedPassword
    });
    return {success : true, message : "User registered successfully", data : result.insertedId}
  } catch (error) {
      console.error(error);
      throw error;
  }
}

async function checkUser(userToFind) {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const { email, password } = userToFind;
    const user = await usersCollection.findOne({email : email});
    
    if(!user){
      return { success : false, message : 'E-mail is wrong' };
    } 
    const chekPass = await bcrypt.compare(password, user.password);

    if(!chekPass) {
      return { success : false, message : 'Password is wrong' }
    }
    return { success : true, message : "Login successful", data : user._id };
  } catch (error) {
    console.error('Error in checkUser:', error);
    throw new Error('Error checking user');
  }
 
}

async function getInitialMileage(userId) {
  try{
    const db = await connectToDatabase();
    const settingsCollection = db.collection('users');
    const user = await settingsCollection.findOne({ userId : userId });
    if(!user){
      return { success : false, message : 'User is not finded' };
    }
    return { success : true, message : "User finded", data : user.mileage };
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
  deleteAllMileageRecords, 
  getInitialMileage,
  insertNewUser,
  checkUser
};