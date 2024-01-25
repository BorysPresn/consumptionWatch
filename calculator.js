const { connectToDatabase } = require('./database');

function processData(data){
    console.log("recived data ", data);
    const { dailyDistance, fuel} = data;
    const now = new Date();
    const fuelConsumption = fuel / dailyDistance * 100;
    let result = {
        date : now.toLocaleDateString("ru-RU"),
        time : now.toLocaleTimeString({ hour12 : false }),
        ...data,
        fuelConsumption : fuelConsumption
    };
    console.log(typeof(totalMileage), typeof(dailyDistance), typeof(fuel), typeof(fuelConsumption));
    console.log(result);
    return result;
}



module.exports = { processData };