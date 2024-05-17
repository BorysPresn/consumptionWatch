export function getCookie(name) {
    const cookieArray = document.cookie.split('; ');
    const cookie = cookieArray.find(c => c.startsWith(name + '='));
    if(cookie){
        return cookie.split('=')[1];
    }
    return null;
}

export function getAndValidateInputs(ids, id, lastMileage){
    const result = {
        isValid: true,
        errorMessage: '',
        inputElem: null,
        formData: {}
    }
    //getting data from form inputs
    for (let id of ids){
        let input = document.getElementById(id)
        let value = parseFloat(input.value.replace(',', '.'));
        result.formData[id] = value;
        // if((id == 'totalMileage'||id == 'distance') && !result.formData[id]) {
        //     result.formData[id] = null;
        // }
    }
    //checking on isNaN & calculate
    for(let id of ids){
        result.inputElem = document.getElementById(id)
        // if(result.formData[id] == null){
        //     result.formData[id] = calculateData(id, result.formData, lastMileage);
        // }
        let value = result.formData[id];
        if(id == 'totalMileage' && value != 0 && value <= lastMileage){
            result.errorMessage = "Mileage can`t be less or equal to the last mileage";
            result.isValid = false;
            return result;
        } else if(Number.isNaN(value) || value <= 0){
            result.errorMessage = "Only positive numbers are allowed";
            result.isValid = false;
            return result;
        } else {
            result.errorMessage = '';
            result.formData[id] = value;
        }
    }
    // console.log(Math.abs(result.formData.totalMileage - result.formData.distance - lastMileage))
    // if(Math.abs(result.formData.totalMileage - result.formData.distance - lastMileage) > 1){
    //     result.inputElem = getElements(['distance', 'totalMileage', 'totalMileageValue']);
    //     result.errorMessage = "Check inputed values in distance and total mileage. They does not match";
    //     result.isValid = false;
    //     return result;
    // }
    result.formData.distance = parseFloat((result.formData.totalMileage - lastMileage).toFixed(2));
    const fuelStatus = document.querySelector('[name="fuelTankStatus"]:checked');
    if(fuelStatus === null){
        result.inputElem = document.querySelectorAll('.fuel-status-label');
        result.errorMessage = "Please choose one of these options";
        result.isValid = false;
        return result;
    }
    result.formData.fullTank = Boolean(fuelStatus.value);
    if (result.formData.fullTank === false){
        result.formData.processed = false;
    }
    result.formData.userId = id;
    console.log(result.formData)
    return result;
}

// function calculateData(key, data, lastMileage) {
  
//     if(key === 'totalMileage') {
//         return parseFloat((lastMileage + data.distance).toFixed(2));
//     }
//     if(key === 'distance') {
//         return parseFloat((data.totalMileage - lastMileage).toFixed(2));
//     }
// }

// function getElements(arrayOfIds){
//     const result = [];
//     console.log(arrayOfIds)
//     arrayOfIds.forEach(elem => {
//         const element = document.getElementById(elem);
//         if(element){
//             result.push(element)
//         }
//     });
//     console.log('result\n', result)
//     return result;
// }

export function insertDataToHtml(data) {
    document.getElementById('underfueled').hidden = true;
    if(data.fullTank === false){
        document.getElementById('underfueled').hidden = false;
    }
    Object.keys(data).forEach(key => {
        
        let elemId = key+'Value'
        let elem = document.getElementById(elemId);
        if(elem){
            elem.textContent = data[key];
        }
    })
}

export function showBlock(blockName, blockArray) {
    

    let blockToShow = null;
    blockArray.forEach(elem => {
        if(elem.id === blockName) {
            blockToShow = elem;
        }
        elem.style.display = 'none';
    });
    blockToShow.style.display = 'block';
    blockToShow = null;
}

export function clearBlocks(){
    document.getElementById('underfueled').setAttribute('hidden', true);
    document.getElementById('historyBlock').innerHTML = '';
    document.querySelectorAll('.nav-item.active').forEach(elem => elem.classList.remove('active'));
    Array.from(document.getElementById('lastRecordBlock').querySelectorAll('.text')).forEach(elem => elem.textContent = '--');
}

export function showError(obj) {
    console.log(obj)
    const inputElems = Array.from(obj.inputElem);
    console.log(inputElems)
    console.log('obj.inputElem.length',obj.inputElem);
    if (obj.inputElem && obj.inputElem.length > 0) {
        obj.inputElem.forEach(elem => elem.classList.add('error'));
    } else {
        obj.inputElem.classList.add('error');
    }
    document.getElementById('error-message').textContent = obj.errorMessage;
}

export function removeError() {
    document.getElementById('error-message').textContent = '';
    document.getElementById('addRecordBlock').querySelectorAll('.error').forEach(elem => elem.classList.remove('error'));
}
