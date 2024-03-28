export function getCookie(name) {
    const cookieArray = document.cookie.split('; ');
    const cookie = cookieArray.find(c => c.startsWith(name + '='));
    if(cookie){
        return cookie.split('=')[1];
    }
    return null;
}

export function getAndValidateInputs(ids, id, lastMileage){
    const response = {
        isValid: true,
        errorMessage: '',
        inputElem: null,
        formData: {}
    }
    for (let id of ids){
        let input = document.getElementById(id)
        let value = parseFloat(input.value.replace(',', '.'));
        response.formData[id] = value;
        if((id == 'totalMileage'||id == 'distance') && !response.formData[id]) {
            response.formData[id] = null;
        }
    }
    for(let id of ids){
        response.inputElem = document.getElementById(id)
        if(response.formData[id] == null){
            response.formData[id] = calculateData(id, response.formData, lastMileage);
        }
        let value = response.formData[id];
        if(id == 'totalMileage' && value != 0 && value <= lastMileage){
            response.errorMessage = "Mileage can`t be less or equal to the last mileage";
            response.isValid = false;
            return response;
        } else if(Number.isNaN(value) || value <= 0){
            response.errorMessage = "Only positive numbers are allowed";
            response.isValid = false;
            return response;
        } else {
            response.errorMessage = '';
            response.formData[id] = value;
        }
    }
    
    if(response.formData.totalMileage - response.formData.distance != lastMileage){console.log('before matching', formData);
        response.errorMessage = "Check inputed values in distance and total mileage. They does not match";
        response.isValid = false;
        return response;
    }
    response.formData.fullTank = document.getElementById('fullTank').checked;
    response.formData.userId = id;
    console.log(response.formData)
    return response;
}

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

function calculateData(key, data, lastMileage) {
  
    if(key == 'totalMileage') {
        return parseFloat((lastMileage + data.distance).toFixed(2));
    }
    if(key == 'distance') {
        return parseFloat((data.totalMileage - lastMileage).toFixed(2));
    }
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
    if(obj.inputElem){
        obj.inputElem.classList.add('error');
    }
    document.getElementById('error-message').textContent = obj.errorMessage;
}

export function removeError(form) {
    document.getElementById('error-message').textContent = '';
    form.querySelectorAll('INPUT').forEach(elem => elem.classList.remove('error'));
}
