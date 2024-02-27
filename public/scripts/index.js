//global Variables


//checking authorization

document.addEventListener('DOMContentLoaded', async function(){
    const cookie = getCookie('token');
    
    if(!cookie) {
        window.location.href = '/login.html';
    } else {
        const userId = getCookie('userId');
        const response = await fetch(`/lastRecord?userId=${userId}`, {
            method : 'GET',
            headers: {
                'Content-Type' : 'application/json',
            },
        });
        const data = await response.json();
        console.log(data);
        insertDataToHtml(data);
    }
})



//logout button

const logoutButtons = document.querySelectorAll('.logout');
logoutButtons.forEach(element => {
    element.addEventListener('click', () => {
        document.cookie = `token=;path=/;max-age=0;secure`;
        document.cookie = `userId=;path=/;max-age=0;secure`;
        window.location.href = '/login.html';
    })
});


// add Record

document.getElementById('add-record-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    let distInp = document.getElementById('distance');
    let tMilInp = document.getElementById('total-mileage');
    let fQuantInp = document.getElementById('fuel-quantity');
    let fPriceInp = document.getElementById('fuel-price');
    let errorBlock = document.getElementById('error-message');

    distInp.classList.remove('error');
    tMilInp.classList.remove('error');
    fQuantInp.classList.remove('error');
    fPriceInp.classList.remove('error');
    errorBlock.innerHTML = '';

    const userId = getCookie('userId');
    const fQuantity = transformInputValue('fuel-quantity');
    const distance = transformInputValue('distance');
    const totalMileage = transformInputValue('total-mileage');
    const fPrice = transformInputValue('fuel-price');
    
    if(Number.isNaN(distance) && Number.isNaN(totalMileage)) { 
        console.log('At least one of these inputs must been filled');
        errorBlock.innerHTML = 'At least one of these inputs must been filled';
        distInp.classList.add('error');
        tMilInp.classList.add('error');
        return;
    } else if(Number.isNaN(fQuantity)) {
        errorBlock.innerHTML = 'Only number';
        fQuantInp.classList.add('error');
        return;
    } else if(Number.isNaN(fPrice)) {
        errorBlock.innerHTML = 'Only number';
        fPriceInp.classList.add('error');
        return;
    }

    if(userId){
        const formData = {
            fuelVolume : fQuantity,
            distance : distance,
            totalMileage : totalMileage,
            fuelPrice : fPrice,
            userId: userId
        }
        console.log(formData);
        document.getElementById('error-message').innerHTML = '';
        const response = await fetch('/addRecord', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });
        const data = await response.json();
        console.log(data);
        insertDataToHtml(data);
    
    } else {
        console.log('no userId');
        window.location.href = '/login.html';
    }
})

function insertDataToHtml(data) {
    document.getElementById('date-value').innerHTML = data.date;
    document.getElementById('time-value').innerHTML = data.time;
    document.getElementById('total-mileage-value').innerHTML = data.totalMileage + ' km';
    document.getElementById('distance-value').innerHTML = data.distance + ' km';
    document.getElementById('consumption-value').innerHTML = data.fuelConsumption + ' L/100km';
    document.getElementById('fuel-quantity-value').innerHTML = data.fuelVolume + ' L';
    document.getElementById('money-spent-value').innerHTML = data.moneySpent + ' Zł';
}

function getCookie(name) {
    const cookieArray = document.cookie.split('; ');
    const cookie = cookieArray.find(c => c.startsWith(name + '='));
    if(cookie){
        return cookie.split('=')[1];
    }
    return null;
}


function transformInputValue(inputId) {
    return parseFloat(document.getElementById(inputId).value.replace(',', '.'));
}