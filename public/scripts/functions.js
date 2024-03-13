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
        if((id == 'totalMileage'||id == 'distance') && !formData[id]) {
            formData[id] = null;
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
            formData[id] = calculateData(id, formData);
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
    console.log(formData)
    return isValid ? formData : null;
}

export function insertDataToHtml(data) {
    Object.keys(data).forEach(key => {
        let elemId = key+'Value';
        document.getElementById(elemId).textContent = data[key];
    })
}

function calculateData(key, data) {
    let prevMileage = parseFloat(document.getElementById(key + 'Value').innerText);
    prevMileage = Number.isNaN(prevMileage) ? sessionStorage.getItem('initialMileage') : prevMileage;
    if(key == 'totalMileage') {
        return prevMileage + data.distance;
    }
    if(key == 'distance') {
        return data.totalMileage - prevMileage;
    }
}


export function showBlock(blockName, blockArray) {
    blockArray.forEach(elem => {
        elem.style.display = 'none';
    });
    blockName.style.display = 'block';
}
