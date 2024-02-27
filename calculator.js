const { getAllMileageRecords, getInitialMileage } = require("./database");

function processData(data){
    //console.log("recived data ", data);
    const { distance, fuelVolume, fuelPrice} = data;
    const now = new Date();
    const fuelConsumption = fuelVolume / distance * 100;
    const moneySpent = fuelVolume * fuelPrice;
    let result = {
        date : now.toLocaleDateString("ru-RU"),
        time : now.toLocaleTimeString({ hour12 : false }),
        userId : data.userId,
        ...data,
        fuelConsumption : cutToTwoDecimals(fuelConsumption),
        moneySpent : cutToTwoDecimals(moneySpent)
    };
    //console.log(result);
    return result;
}
async function updateStatistic(initialMileage, userId) {
    const allData = await getAllMileageRecords(userId);
    // const initialMileage = await getInitialMileage(userId);
    if(allData.data.length == 0){ 
        return { 
            success : false,
            message : "There's no data for statistics yet"
        }
    }
    const dataToReturn = getStatistic(allData.data, initialMileage);
    console.log("returning: ", dataToReturn)
    return dataToReturn;
}

function getStatistic(data, initial) {
    let averDistance = 0;
    let totalFuelConsumed = 0;
    let averConsumption = 0;
    let totalmoneySpent = 0;
    let counter = 0;
    
    data.forEach(record => {
        averDistance += parseFloat(record.distance);
        totalFuelConsumed += parseFloat( record.fuelVolume);
        averConsumption += parseFloat(record.fuelConsumption);
        totalmoneySpent += parseFloat(record.moneySpent);
        counter++;
    })

    return {
        success : true,
        message : "Statistic was updated successfully",
        data : {
            totalTraveled : cutToTwoDecimals(parseFloat(data[data.length-1].totalMileage - initial)),
            averDistance : cutToTwoDecimals(parseFloat(averDistance / counter)),
            totalFuelConsumed : cutToTwoDecimals(totalFuelConsumed),
            averConsumption: cutToTwoDecimals(parseFloat(averConsumption / counter)),
            totalmoneySpent : cutToTwoDecimals(totalmoneySpent)
        }
    }
};

function cutToTwoDecimals(number) {
    return Math.floor(number * 100) / 100;
}

module.exports = { processData, updateStatistic, getStatistic };