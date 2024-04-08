import { getCookie, getAndValidateInputs, insertDataToHtml, showBlock, clearBlocks, showError, removeError }  from "./functions.js"
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
const contentItems = Object.values(contentBlocks);

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
    // console.log(response)
    if(response.ok) {
        sessionStorage.setItem('initialMileage', initialMileage);
        document.cookie = `token=${token};path=/;max-age=1800;secure`;
        document.cookie = `userId=${userId};path=/;max-age=1800;secure`;
        showBlock('mainContentBlock', authItems);
        showBlock("addRecordBlock", contentItems);
        document.querySelectorAll(`[data-target="addRecordBlock"]`).forEach(elem => elem.classList.add('active'));
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
        showBlock("addRecordBlock", contentItems);
        document.querySelectorAll(`[data-target="addRecordBlock"]`).forEach(elem => elem.classList.add('active'));
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
        showBlock("addRecordBlock", contentItems);

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
            // console.log('authorization',data);
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
        const offcanvasNavbar = document.getElementById('offcanvasNavbar');
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasNavbar);
        if (bsOffcanvas) {
            bsOffcanvas.hide();
        }
        document.cookie = `token=;path=/;max-age=0;secure`;
        document.cookie = `userId=;path=/;max-age=0;secure`;
        sessionStorage.clear();
        showBlock('loginBlock', authItems);
        clearBlocks();
    })
});

// Sidebar 

let sidebarArray = document.querySelectorAll('.sidebar');
sidebarArray.forEach(elem => elem.addEventListener('click', async (e) =>{
    try {
        const target = e.target.closest('.nav-item');
        if(target){
            document.querySelectorAll('.nav-item.active').forEach(elem => elem.classList.remove('active'));
            target.classList.add('active');
            const action = target.dataset.target;
            if(action === 'historyBlock') {
                generateHistory(await getHistory());
            }
            showBlock(action, contentItems)
        }
    } catch (error) {
        console.error(error);
    }
}));


// add Record
const addRecordForm = document.getElementById('add-record-form');
addRecordForm.addEventListener('submit', async (e) => {
    try {
        e.preventDefault();
        const inputIds = ['fuelVolume', 'distance', 'totalMileage', 'fuelPrice'];
        const userId = getCookie('userId');
        
        if(!userId){
            console.log('no userId');
            showBlock('loginBlock', authItems);
            return;
        }

        const validationResponse = getAndValidateInputs(inputIds, userId, lastMileage);
        if(!validationResponse.isValid){
            showError(validationResponse);
            throw new Error(validationResponse.errorMessage);
        } 
        removeError(addRecordForm);
        const response = await fetch('/addRecord', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(validationResponse.formData),
        });
        const data = await response.json();

        insertDataToHtml(data);
        addRecordForm.reset();
        
        lastMileage = data.totalMileage;
    } catch (error) {
        console.error(error);
    }
})

// History
async function getHistory() {
    try {
        const userId = getCookie('userId');

        if(!userId){
            console.log('no userId');
            showBlock('loginBlock', authItems);
            return;
        }

        const response = await fetch(`/history?userId=${userId}`,{
            method : 'GET',
            headers : {
                'Content-Type' : 'application/json',
            }
        })
        if(!response.ok){
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const history = await response.json();
        console.log(history)
        return history;
    } catch (error) {
        console.error(error)
    }
}
function generateHistory(history) {
    contentBlocks.historyBlock.innerHTML = '';
    history.data.reverse();
    history.data.forEach(elem => {
        
        const rowDiv = document.createElement('div');
        rowDiv.className = "row px-1";
        
        const colDiv = document.createElement('div');
        colDiv.className = "col border rounded-1 mt-2 p-2";
        
        colDiv.innerHTML = `<div class="row">
                                    <div class="col pe-0"id="history-date"><b>${elem.date} at ${elem.time}</b></div>`+
                                    // <div class="col-1 text-end">
                                    //     <button type="button" class="btn-close" aria-label="Close"></button>
                                    // </div>
                                `</div>
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
        if(elem.fullTank === false){
            let redBlock = document.createElement('div');
            redBlock.className = "text-danger fw-bold";
            redBlock.textContent = 'underfueled';
            colDiv.prepend(redBlock);
        }
        contentBlocks.historyBlock.appendChild(rowDiv);
    });
};

// Statistic

// async function generateStatistic() {

// }