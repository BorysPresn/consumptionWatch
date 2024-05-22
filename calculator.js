const { 
    getAllMileageRecords, 
    getInitialMileage, 
    getLastFullTankedRecord, 
    getLatestMileageRecord, 
    getPartialTankRecords, 
    updateRecords } = require("./database");

async function processData(data, id){
    try {
        const dataToProcess = {...data};
        let summary = {};
        const lastRecord = await getLatestMileageRecord(id);
        const recordToUSe = lastRecord ? lastRecord.totalMileage : await getInitialMileage(data.userId);
        if(!recordToUSe){
            throw new Error(`Error while getting recordToUse`);
        }
        console.log('recordToUse',recordToUSe);
        console.log('dataToProcess', dataToProcess);
        const validationResult = checkValidity(dataToProcess, recordToUSe);
        
        if(!validationResult.success) {
            throw new Error(`Error! validation failed : ${validationResult.message}`);
        }
        
        //calculate and add 
        const { distance, fuelVolume, fuelPrice } = dataToProcess;
        const now = new Date();
        const fuelConsumption = fuelVolume / distance * 100;
        const moneySpent = fuelVolume * fuelPrice;
        dataToProcess.fuelConsumption = cutToTwoDecimals(fuelConsumption);
        dataToProcess.moneySpent = cutToTwoDecimals(moneySpent);
        dataToProcess.date = now.toLocaleDateString("ru-RU");
        dataToProcess.time = now.toLocaleTimeString({ hour12 : false });

        //if tanked full tank - check all records in DB for fullTank : false, process them for SUMMARY
        if(dataToProcess.fullTank){
            //gettinfg summary of partial tank records and this FULL tank record
            const partialTankRecords = await getPartialTankRecords(id);
            if(!partialTankRecords){
                throw new Error(`Error while getting partialTankRecords`);
            }
            // console.log('partial wihtout last record', partialTankRecords);
            partialTankRecords.push(dataToProcess);
            // console.log('partialrecords\n', partialTankRecords);
            summary = partialTankRecords.reduce((accumulator, record) => {
                accumulator.distance += record.distance;
                accumulator.fuelVolume += record.fuelVolume;
                accumulator.moneySpent += record.moneySpent;
                return accumulator;
            }, {
                distance: 0,
                fuelVolume: 0,
                moneySpent: 0
            }) ;
           
            
            summary.fuelVolume = parseFloat(summary.fuelVolume.toFixed(2));
            summary.moneySpent = parseFloat(summary.moneySpent.toFixed(2));
            summary.fuelConsumption = parseFloat((summary.fuelVolume / summary.distance * 100).toFixed(2));
            // console.log('partial tank records summary\n', summary );

            summary.fuelPrice = cutToTwoDecimals(summary.moneySpent / summary.fuelVolume);

            // console.log('data = \n', data);

            summary.date = now.toLocaleDateString("ru-RU");
            summary.time = now.toLocaleTimeString({ hour12 : false });
            summary.isSummary = true;
            const summaryId = generateId();
            summary.summaryId = summaryId;

            //add unique ID to records
            partialTankRecords.forEach(elem => { 
                elem.summaryId = summaryId;
                elem.processed = true;
                elem.processedAt = now.toISOString();
             });
            // await updateRecords(partialTankRecords);
            console.log('Records updated\n', partialTankRecords);
        }
       
        return { dataToProcess, summary };
    
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
    delete newData.processed;
    
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
function generateId () {
    return new Date().getTime().toString();
}

module.exports =  { processData, getStatistic, calcStatistic };