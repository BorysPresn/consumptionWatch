const { getAllMileageRecords } = require("./database");

function processData(data){
    console.log("recived data ", data);
    const { dailyDistance, fuelVolume, fuelCost} = data;
    const now = new Date();
    const fuelConsumption = fuelVolume / dailyDistance * 100;
    const moneySpend = fuelVolume * fuelCost;
    let result = {
        date : now.toLocaleDateString("ru-RU"),
        time : now.toLocaleTimeString({ hour12 : false }),
        ...data,
        fuelConsumption : fuelConsumption,
        moneySpend : moneySpend
    };
    console.log(result);
    return result;
}
async function updateStatistic(initialMileage) {
    let averDailyDistance = 0;
    let totalFuelConsumed = 0;
    let averConsumption = 0;
    let totalMoneySpended = 0;
    let counter = 0;
    const allData = await getAllMileageRecords();
    if(allData.length == 0){ return { message : "No data"}}
    allData.forEach(record => {
        averDailyDistance += record.dailyDistance;
        totalFuelConsumed += record.fuelVolume;
        averConsumption += record.fuelConsumption;
        totalMoneySpended += record.moneySpend;
        counter++;
    })
    return {
        totalTraveled : allData[allData.length-1].totalMileage - initialMileage,
        averDailyDistance : averDailyDistance / counter,
        totalFuelConsumed,
        averConsumption: averConsumption / counter,
        totalMoneySpended : totalMoneySpended
    }
}


module.exports = { processData, updateStatistic };