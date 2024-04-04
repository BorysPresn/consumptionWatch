import { getAllMileageRecords, getInitialMileage, getLastFullTankedRecord, getLatestMileageRecord, getPartialTankRecords, deletePartialTankRecords } from "./database";

async function processData(data, id){
    try {
        const dataToProcess = {...data};
        let calcPartialTankRecords = {};
        const lastRecord = await getLatestMileageRecord(id);
        const recordToUSe = lastRecord ? lastRecord.totalMileage : await getInitialMileage(data.userId);
        if(!recordToUSe){
            throw new Error(`Error while getting recordToUse`);
        }
        const validationResult = checkValidity(dataToProcess, recordToUSe);
        
        if(!validationResult.success) {
            throw new Error(`Error! validation failed : ${validationResult.message}`);
        }
        
        const { distance, fuelVolume, fuelPrice } = data;
        const now = new Date();
        const fuelConsumption = fuelVolume / distance * 100;
        const moneySpent = fuelVolume * fuelPrice;
        dataToProcess.moneySpent = moneySpent;
        //if tanked full tank - check all records in DB for fullTank : false, process and finaly delete them
        if(data.fullTank){
            const partialTankRecords = await getPartialTankRecords(id);
            if(!partialTankRecords){
                throw new Error(`Error while getting partialTankRecords`);
            }
            partialTankRecords.push(dataToProcess);
            calcPartialTankRecords = partialTankRecords.reduce((accumulator, record) => {
                accumulator.distance += record.distance;
                accumulator.fuelVolume += record.fuelVolume;
                accumulator.moneySpent += record.moneySpent;

                return accumulator;
            }, {
                distance: 0,
                fuelVolume: 0,
                moneySpent: 0
            }) ;
            calcPartialTankRecords.fuelPrice = cutToTwoDecimals(calcPartialTankRecords.moneySpent / calcPartialTankRecords.fuelVolume);
            data = { ...dataToProcess, ...calcPartialTankRecords};
            await deletePartialTankRecords(id)
        }

        let result = {
            date : now.toLocaleDateString("ru-RU"),
            time : now.toLocaleTimeString({ hour12 : false }),
            
            ...data,
            fuelConsumption : cutToTwoDecimals(fuelConsumption),
            moneySpent : cutToTwoDecimals(moneySpent)
        };
       
        return result;
    
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function getStatistic(initialMileage, userId) {
    const allData = await getAllMileageRecords(userId);
    // const initialMileage = await getInitialMileage(userId);
    if(allData.data.length == 0){ 
        return { 
            success : false,
            message : "There's no data for statistics yet"
        }
    }
    const dataToReturn = calcStatistic(allData.data, initialMileage);
    console.log("returning: ", dataToReturn)
    return dataToReturn;
}

function calcStatistic(data, initial) {
    let averDistance = 0;
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
    let result = {
        message: ``,
        success: true
    };
    newData = {...data};
    if(typeof newData.fullTank !== 'boolean'){
        result.message += `(fullTank: not boolean)\n`;
        result.success = false;
    }
    delete newData.userId;
    delete newData.fullTank;

    for(let key in newData){
        let value = newData[key];
        if(!value || Number.isNaN(value) || value <= 0){
            result.message += `(${key}:${value})\n`;
            result.success = false;
        }
    }
        
    if(newData.totalMileage - newData.distance != record){
        result.message += `(totalMileage - distance != lastRecord)\n`;
        result.success = false;
    }
   
    return result;
}

export default { processData, getStatistic, calcStatistic };