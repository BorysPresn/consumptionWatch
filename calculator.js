const { getAllMileageRecords, getInitialMileage, getLastMileageRecord, getPartialTankRecords } = require("./database");

async function processData(data, id){
    try {
        
        const lastRecord = await getLastMileageRecord(id);
        // console.log('last record : ', lastRecord, data.userId)
        const recordToUSe = lastRecord ? lastRecord.totalMileage : await getInitialMileage(data.userId);
        // console.log('recordToUse : ', recordToUSe);
        const valid = checkValidity(data, recordToUSe);
        // console.log("valid = " + valid)
        
        if(!valid) {
            console.log('imhere')
            return null;
        }
        const partialTankRecords = await getPartialTankRecords(id);
        partialTankRecords.push(data);
        const calcPartialTankRecords = partialTankRecords.reduce((accumulator, record) => {
            accumulator.distance += record.distance;
            accumulator.fuelVolume += record.fuelVolume;
            accumulator.moneySpent += record.moneySpent;
        }, {
            distance: 0,
            fuelVolume: 0,
            moneySpent: 0
        }) ;
        calcPartialTankRecords.fuelCost = calcPartialTankRecords.moneySpent / calcPartialTankRecords.fuelVolume;
        // const { distance, fuelVolume, fuelPrice} = data;
        // const now = new Date();
        // const fuelConsumption = fuelVolume / distance * 100;
        // const moneySpent = fuelVolume * fuelPrice;
        // let result = {
        //     date : now.toLocaleDateString("ru-RU"),
        //     time : now.toLocaleTimeString({ hour12 : false }),
        //     userId : data.userId,
        //     ...data,
        //     fuelConsumption : cutToTwoDecimals(fuelConsumption),
        //     moneySpent : cutToTwoDecimals(moneySpent)
        // };
       
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
    //let averDistance = 0;
    let totalFuelConsumed = 0;
    let averConsumption = 0;
    let totalmoneySpent = 0;
    let counter = 0;
    
    data.forEach(record => {
        averDistance += record.distance;
        totalFuelConsumed += record.fuelVolume;
        averConsumption += record.fuelConsumption;
        totalmoneySpent += record.moneySpent;
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
    return parseFloat(number.toFixed(2));
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