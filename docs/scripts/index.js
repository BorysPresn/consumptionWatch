// Sidebar 
let sidebarArray = document.querySelectorAll('.sidebar');
sidebarArray.forEach(elem => elem.addEventListener('click', (e) =>{
    const target = e.target.closest('.nav-item');
    if(target){
        document.querySelectorAll('.nav-item.active').forEach(elem => elem.classList.remove('active'));
        target.classList.add('active');
    }
}));



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
    const inputIds = ['fuelVolume', 'distance', 'totalMileage', 'fuelPrice'];
    const userId = getCookie('userId');

    if(!userId){
        console.log('no userId');
        window.location.href = '/login.html';
        return;
    }

    const formData = getAndValidateInputs(inputIds);

    if(!formData){
        console.log('validation failed');
        return;
    }
    console.log(formData);

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

})


function getCookie(name) {
    const cookieArray = document.cookie.split('; ');
    const cookie = cookieArray.find(c => c.startsWith(name + '='));
    if(cookie){
        return cookie.split('=')[1];
    }
    return null;
}

function getAndValidateInputs(ids){
    let isValid = true;
    let errorMessage = document.getElementById('error-message');
    let formData = {};
    ids.forEach(id => {
        let input = document.getElementById(id)
        let value = parseFloat(input.value.replace(',', '.'));
        if(Number.isNaN(value) || value <= 0){
            input.classList.add('error');
            errorMessage.innerHTML = "Only positive numbers are allowed";
            isValid = false;
        } else {
            input.classList.remove('error');
            errorMessage.innerHTML = '';
            formData[id] = value;
        }
    })
    return isValid ? formData : null;
}

function insertDataToHtml(data) {
    Object.keys(data).forEach(key => {
        let elemId = key+'Value';
        document.getElementById(elemId).innerHTML = data[key];
    })
}