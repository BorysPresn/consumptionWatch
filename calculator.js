const { getAllMileageRecords } = require("./database");

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
async function updateStatistic(initialMileage) {
    let averDailyDistance = 0;
    let totalFuelConsumed = 0;
    let averConsumption = 0;
    let counter = 0;
    const allData = await getAllMileageRecords();
    allData.forEach(record => {
        averDailyDistance += record.dailyDistance;
        totalFuelConsumed += record.fuel;
        averConsumption += record.fuelConsumption;
        counter++;
    })
    return {
        totalTraveled : allData[allData.length-1].totalMileage - initialMileage,
        averDailyDistance : averDailyDistance / counter,
        totalFuelConsumed,
        averConsumption: averConsumption / counter
    }
}


module.exports = { processData, updateStatistic };