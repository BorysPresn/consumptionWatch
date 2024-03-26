export function getCookie(name) {
    const cookieArray = document.cookie.split('; ');
    const cookie = cookieArray.find(c => c.startsWith(name + '='));
    if(cookie){
        return cookie.split('=')[1];
    }
    return null;
}

export function getAndValidateInputs(ids, id, lastMileage){
    let lastMileageElem = document.querySelector('.record-item.total-mileage');
    let isValid = true;
    let errorMessage = document.getElementById('error-message');
    let formData = {};
    for (let id of ids){
        let input = document.getElementById(id)
        let value = input.value.replace(',', '.');
        formData[id] = value;
        //console.log(id, formData[id]);
        if((id == 'totalMileage'||id == 'distance') && !formData[id]) {
            formData[id] = null;
            console.log('fData = null');
        }
    }
    if(!formData.totalMileage && !formData.distance){
        errorMessage.textContent = 'At least one of these inputs must been filled';
        return;
    }
    
    // console.log('before', formData)
    for(let id of ids){
        
        let input = document.getElementById(id)
        if(formData[id] == null){
            console.log('lastMileage', lastMileage)
            formData[id] = calculateData(id, formData, lastMileage);
        }
        let value = parseFloat(formData[id]);
        if(id == 'totalMileage' && value != 0 && value <= lastMileage){
            errorMessage.textContent = "'Mileage can`t be less or equal to the last mileage'";
            input.classList.add('error');
            
            lastMileageElem.classList.add('bg-danger');
            isValid = false;
            break;
        }
        else if(Number.isNaN(value) || value <= 0){
            // if(id=='totalMileage' || id == 'distance') continue;
            input.classList.add('error');
            errorMessage.textContent = "Only positive numbers are allowed";
            isValid = false;
            break;
        } else {
            input.classList.remove('error');
            lastMileageElem.classList.remove('bg-danger');
            errorMessage.textContent = '';
            formData[id] = value;
        }
    }
    formData = {...formData, userId : id}
    // console.log(formData)
    return isValid ? formData : null;
}

export function insertDataToHtml(data) {
    document.getElementById('underfueled').hidden = true;
    if(data.fullTank === false){
        document.getElementById('underfueled').hidden = false;
    }
    console.log('inFunction', data)
    Object.keys(data).forEach(key => {
        
        let elemId = key+'Value'
        //console.log(elemId)
        let elem = document.getElementById(elemId);
        if(elem){
            elem.textContent = data[key];
        }
    })
}

function calculateData(key, data, lastMileage) {
  
    console.log('lastMileage', lastMileage);
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
        // console.log('showBlock.display.none', elem)
        elem.style.display = 'none';
    });
    // console.log(blockToShow);
    blockToShow.style.display = 'block';
    blockToShow = null;
}

export function clearRecordBlock(){
    document.getElementById('underfueled').setAttribute('hidden', true);
    document.getElementById('historyBlock').innerHTML = '';
    Array.from(document.getElementById('lastRecordBlock').querySelectorAll('.text')).forEach(elem => elem.textContent = '--');
}

