import { getCookie, getAndValidateInputs, insertDataToHtml, showBlock, clearRecordBlock }  from "./functions.js"
let lastMileage = null;

let authBlocks = {
    loginBlock : document.getElementById('loginBlock'),
    registerBlock : document.getElementById('registerBlock'),
    mainContentBlock : document.getElementById('mainContentBlock')
};
const authItems = Object.values(authBlocks);

let contentBlocks = {
    addRecordBlock : document.getElementById('addRecordBlock'),
    historyBlock : document.getElementById('historyBlock'),
    statisticBlock : document.getElementById('statisticBlock'),
    aboutBlock : document.getElementById('aboutBlock'),
    helpBlock : document.getElementById('helpBlock')
};
const navigateItems = Object.values(contentBlocks);

//checking authorization
document.addEventListener('DOMContentLoaded', checkAuthorization);


//Login
document.getElementById('registerLink').addEventListener('click', function() { 
    showBlock('registerBlock', authItems);
    return;
});
document.getElementById('login-form').addEventListener('submit', async function (e){
    e.preventDefault();
    let loginErrorBlock = document.getElementById('loginErrorBlock');
    const formData = {
        email : document.getElementById('login-email').value,
        password : document.getElementById('login-password').value,
    };
    // console.log(formData)
    // sending data to server
    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });
    const {userId, token, message, initialMileage} = await response.json();
    console.log(response)
    if(response.ok) {
        sessionStorage.setItem('initialMileage', initialMileage);
        document.cookie = `token=${token};path=/;max-age=1800;secure`;
        document.cookie = `userId=${userId};path=/;max-age=1800;secure`;
        showBlock('mainContentBlock', authItems);
        showBlock("addRecordBlock", navigateItems);
        loginErrorBlock.textContent = '';
        await checkAuthorization();
        return;
    } else {
        console.log(response, message)
        loginErrorBlock.textContent = message;
        return;
    }
});

//Register
document.getElementById('loginLink').addEventListener('click', function() { 
    showBlock('loginBlock', authItems); 
    return;
});
document.getElementById('registration-form').addEventListener('submit', async function(e){
    e.preventDefault(); 
    let errorBlock = document.getElementById('registerErrorBlock');
    const mileageInput = document.getElementById('initial-mileage');
    const formData = {
        email : document.getElementById('register-email').value,
        password : document.getElementById('register-password').value,
        initialMileage : parseFloat(mileageInput.value)
    };
    if(formData.initialMileage < 0 || !formData.initialMileage){
        mileageInput.classList.add('error');
        errorBlock.textContent = "Only positive numbers are alowed!";
    }
    // sending data to server
    const response = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });

    const {userId, token, message, initialMileage} = await response.json();
    if(userId && token) {
        sessionStorage.setItem('initialMileage', initialMileage);
        document.cookie = `token=${token};path=/;max-age=1800;secure`;
        document.cookie = `userId=${userId};path=/;max-age=1800;secure`;
        showBlock('mainContentBlock', authItems);
        showBlock("addRecordBlock", navigateItems);
        errorBlock.textContent = '';
        mileageInput.classList.remove('error');
        await checkAuthorization();
    } else {
        errorBlock.textContent = message;
        return;
    }
    // console.log('Response:', {userId, token, message, initialMileage});
});


async function checkAuthorization(){
    try {
        const cookie = getCookie('token');

        if(!cookie) {
            showBlock("loginBlock", authItems);
            return;
        }
        
        showBlock("mainContentBlock", authItems);
        showBlock("addRecordBlock", navigateItems);

        const userId = getCookie('userId');
        const response = await fetch(`/lastRecord?userId=${userId}`, {
            method : 'GET',
            headers: {
                'Content-Type' : 'application/json',
            },
        });
        if(!response.ok){
            console.log('no data to insert \n getting initial mileage from USERS COLL');
            document.getElementById('lastRecordBlock').hidden = true;
            // const response = await fetch(`/initialMilaege?userId=${userId}`, {
            //     method: 'GET',
            //     headers: {
            //         'Content-Type' : 'application/json',
            //     },
            // });
            // if(!response.ok) {
            //     console.log(response.status)
            //     return;
            // } else {    
            //     const data = await response.json();
            //     data.totalMileage = data.initialMileage;
            //     delete data.initialMileage;
                
            //     insertDataToHtml(data);
            //     return;
            // }

        } else {
            document.getElementById('lastRecordBlock').removeAttribute('hidden');
            const data = await response.json();
            console.log('authorization',data);
            insertDataToHtml(data);
            lastMileage = data.totalMileage
        }
    } catch (error) {
        console.log("error")
    }
};

//logout button

const logoutButtons = document.querySelectorAll('.logout');
logoutButtons.forEach(element => {
    element.addEventListener('click', () => {
        document.cookie = `token=;path=/;max-age=0;secure`;
        document.cookie = `userId=;path=/;max-age=0;secure`;
        showBlock('loginBlock', authItems);
        clearRecordBlock();
    })
});

// Sidebar 

let sidebarArray = document.querySelectorAll('.sidebar');
sidebarArray.forEach(elem => elem.addEventListener('click', (e) =>{
    const target = e.target.closest('.nav-item');
    if(target){
        document.querySelectorAll('.nav-item.active').forEach(elem => elem.classList.remove('active'));
        target.classList.add('active');
        showBlock(target.dataset.target, navigateItems);
    }
    
}));


// add Record
const addRecrdForm = document.getElementById('add-record-form');
addRecrdForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputIds = ['fuelVolume', 'distance', 'totalMileage', 'fuelPrice'];
    const userId = getCookie('userId');
    
    if(!userId){
        console.log('no userId');
        showBlock('loginBlock', authItems);
        return;
    }

    const formData = getAndValidateInputs(inputIds, userId, lastMileage);
    
    if(!formData){
        console.log('validation failed');
        return;
    } 

    formData.fullTank = document.getElementById('fullTank').checked;
    
    const response = await fetch('/addRecord', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });
    const data = await response.json();

    console.log('inserting...')
    insertDataToHtml(data);
    addRecrdForm.reset();
    
    lastMileage = data.totalMileage;
})

// History

document.getElementById('history').addEventListener('click', async function (e) {
    
    const userId = getCookie('userId');
    const history = await fetch(`/history?userId=${userId}`,{
        method : 'GET',
        headers : {
            'Content-Type' : 'application/json',
        }
    })
    const response = await history.json();
    console.log(response)
    response.data.reverse();
    response.data.forEach(elem => {

        const rowDiv = document.createElement('div');
        rowDiv.className = "row px-1";
        
        const colDiv = document.createElement('div');
        colDiv.className = "col border rounded-1 mt-2 p-2";

        colDiv.innerHTML = `<div class="row">
                                    <div class="col pe-0"id="history-date"><b>${elem.date} at ${elem.time}</b></div>
                                    <div class="col-1 text-end">
                                        <button type="button" class="btn-close" aria-label="Close"></button>
                                    </div>
                                </div>
                                <hr>
                                <div class="row ps-2 ps-sm-0">
                                    <div class="col-12 col-sm-6 text-left"><b>Mileage : </b>${elem.totalMileage} km</div>
                                    <div class="col-12 col-sm-6 text-left"><b>Distance : </b>${elem.distance} km</div>
                                    <div class="col-12 col-sm-6 text-left"><b>Fueled : </b>${elem.fuelVolume} L</div>
                                    <div class="col-12 col-sm-6 text-left"><b>Fuel price : </b>${elem.fuelPrice} Zł/L</div>
                                    <div class="col-12 col-sm-6 text-left"><b>Fuel cost : </b>${elem.moneySpent} Zł</div>
                                    <div class="col-12 col-sm-6 text-left"><b>Consumption : </b>${elem.fuelConsumption} L/100km</div>
                            </div>`;
        rowDiv.appendChild(colDiv);
        historyBlock.appendChild(rowDiv);
    });
});