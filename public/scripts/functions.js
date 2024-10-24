export function getCookie(name) {
    const cookieArray = document.cookie.split('; ');
    const cookie = cookieArray.find(c => c.startsWith(name + '='));
    if(cookie){
        return cookie.split('=')[1];
    }
    return null;
}

export function getAndValidateInputs(ids, id, lastMileage,){
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
        
    }
    //checking on isNaN & calculate
    for(let id of ids){
        result.inputElem = document.getElementById(id)
        
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
export async function handleSuccessfullLogin(params, authItems, contentItems, errorBlock, form) {
    const {userId, initialMileage} = params;
    sessionStorage.setItem('initialMileage', initialMileage);
    document.cookie = `userId=${userId};path=/;max-age=1800;secure`;
    showBlock('mainContentBlock', authItems);
    showBlock("addRecordBlock", contentItems);
    document.querySelectorAll(`[data-target="addRecordBlock"]`).forEach(elem => elem.classList.add('active'));
    errorBlock.textContent = '';
    form.reset();
    
}

export function checkAuthorization(){
    const cookie = getCookie('userId');
    return cookie ? cookie : false;
}

export async function fetchRecordData(id = getCookie('userId')) {
    try{
        const response = await fetch(`/lastRecord?userId=${id}`, {
            method : 'GET',
            headers: {
                'Content-Type' : 'application/json',
            },
        });
        if(!response.ok){
            console.log('no data to insert \n getting initial mileage from USERS COLL');
            document.getElementById('lastRecordBlock').hidden = true;
        } else {
            document.getElementById('lastRecordBlock').removeAttribute('hidden');
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.log("error")
    }
}

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
export function logout(authItems){
    document.cookie = `token=;path=/;max-age=0;secure`;
    document.cookie = `userId=;path=/;max-age=0;secure`;
    sessionStorage.clear();
    showBlock('loginBlock', authItems);
    clearContentElems();
}

export function insertData(data) {
    const tankStatusElem = document.getElementById('tankStatus');
    if(data.fullTank === false){
        tankStatusElem.innerText = 'tank was underfueled';
        tankStatusElem.className = 'fw-bold text-danger';
    }
    if(data.isSummary === true){
        tankStatusElem.innerText = '\t summary';
        tankStatusElem.className = 'fw-bold text-primary';
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

export function clearContentElems(){
    document.getElementById('tankStatus').innerText = '';
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
