const { getAllMileageRecords, getInitialMileage, getLastMileageRecord } = require("./database");

async function processData(data){
    try {
        const lastRecord = await getLastMileageRecord(data.userId);
        // console.log('last record : ' + JSON.stringify(lastRecord))
        const recordToUSe = lastRecord.totalMileage ? lastRecord.totalMileage : await getInitialMileage(data.userId);
        // console.log('recordToUse : ' + JSON.stringify(recordToUSe));

        const valid = checkValidity(data, recordToUSe);
        console.log("valid = " + valid)
        if(valid == false) {
            console.log('imhere')
            return null;
        }
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
        return result;
    } catch (error) {
        console.error(error);
        throw new Error("Error while processing data");
    }
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
        totalTraveled : cutToTwoDecimals(parseFloat(data[data.length-1].totalMileage - initial)),
        averDistance : cutToTwoDecimals(parseFloat(averDistance / counter)),
        totalFuelConsumed : cutToTwoDecimals(totalFuelConsumed),
        averConsumption: cutToTwoDecimals(parseFloat(averConsumption / counter)),
        totalmoneySpent : cutToTwoDecimals(totalmoneySpent)
    }
};

function cutToTwoDecimals(number) {
    return Math.floor(number * 100) / 100;
}

function checkValidity(data, record) {
    newData = {...data};
    delete newData.userId;
    const validData =  Object.values(newData).every(value => !Number.isNaN(value) && value > 0);
    console.log('checkValidity()\n ','data= ' + JSON.stringify(newData),'\n', 'data = ' + JSON.stringify(data) );
    if(!validData) {
        return false;
    }
    
    return data.totalMileage > record;
}

module.exports = { processData, updateStatistic, getStatistic };