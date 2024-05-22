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
        const cookie = getCookie('token');
        if(!cookie) {
            showBlock("loginBlock", authItems);
            return;
        }
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
        const inputIds = ['fuelVolume',  'totalMileage', 'fuelPrice']; //'distance',
        const userId = getCookie('userId');
        
        if(!userId){
            console.log('no userId');
            showBlock('loginBlock', authItems);
            return;
        }
        removeError();
        const validatedData = getAndValidateInputs(inputIds, userId, lastMileage);
        if(!validatedData.isValid){
            showError(validatedData);
            throw new Error(validatedData.errorMessage);
        } 
        //removeError();
        const response = await fetch('/addRecord', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(validatedData.formData),
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
// <div class="col-1 text-end">
//     <button type="button" class="btn-close" aria-label="Close"></button>
// </div>
function generateHistory(history) {
    contentBlocks.historyBlock.innerHTML = '';
    history.data.reverse();
    
    for (let i = 0; i < history.data.length; i++){
        const elem = history.data[i];
        const innerHTMLText = `<div class="row">
                            <div class="col pe-0"id="history-date"><b>${elem.date} at ${elem.time}</b></div>
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
        const rowDiv = document.createElement('div');
        rowDiv.className = "row px-1";
        
        const colDiv = document.createElement('div');
        colDiv.className = "col border rounded-1 mt-2 p-2";
        colDiv.innerHTML = innerHTMLText;
        rowDiv.appendChild(colDiv);

        if (history.data[i].fullTank === true && (i < history.data.length -1) && history.data[i+1].fullTank === false ) {
            //create accordion
            console.log('accordion');
            const accordion = document.createElement('div');
            accordion.className = 'accordion';
            accordion.setAttribute('id', `accordion${i}`);
            const accordionItem = document.createElement('div');
            accordionItem.className = "accordion-item";
            const accordionButton = document.createElement('button');
            accordionButton.className = "accordion-button collapsed accordion-bg";
            
            accordionButton.setAttribute('type',"button");
            accordionButton.setAttribute("data-bs-toggle", "collapse");
            accordionButton.setAttribute("data-bs-target", `#collapse${i}`);
            accordionButton.setAttribute("aria-expanded", "false");
            accordionButton.setAttribute("aria-controls", `collapse${i}`);

            const accordionTarget = document.createElement('div');
            accordionTarget.className = "accordion-collapse collapse";
            accordionTarget.setAttribute('id', `collapse${i}`);
            accordionTarget.setAttribute("data-bs-parent", `#accordion${i}`)

            const accordionBody = document.createElement('div');
            accordionBody.className = "accordion-body accordion-bg";

            while (i + 1 < history.data.length && history.data[i + 1].fullTank === false){
                i++;
                const elem = history.data[i];
                accordionBody.innerHTML += `<div class="col border rounded-1 mt-2 p-2 bg-white">
                                                <div class="text-danger fw-bold"> underfueled </div>
                                                <div class="row">
                                                    <div class="col pe-0"id="history-date"><b>${elem.date} at ${elem.time}</b></div>
                                                </div>
                                                <hr>
                                                <div class="row ps-2 ps-sm-0">
                                                    <div class="col-12 col-sm-6 text-left"><b>Mileage : </b>${elem.totalMileage} km</div>
                                                    <div class="col-12 col-sm-6 text-left"><b>Distance : </b>${elem.distance} km</div>
                                                    <div class="col-12 col-sm-6 text-left"><b>Fueled : </b>${elem.fuelVolume} L</div>
                                                    <div class="col-12 col-sm-6 text-left"><b>Fuel price : </b>${elem.fuelPrice} Zł/L</div>
                                                    <div class="col-12 col-sm-6 text-left"><b>Fuel cost : </b>${elem.moneySpent} Zł</div>
                                                    <div class="col-12 col-sm-6 text-left"><b>Consumption : </b>${elem.fuelConsumption} L/100km</div>
                                                </div>
                                            </div>`;
            }
            accordionTarget.appendChild(accordionBody);
            accordionItem.appendChild(accordionButton);
            accordionItem.appendChild(accordionTarget);
            accordion.appendChild(accordionItem);
            colDiv.appendChild(accordion);
        }
        
        rowDiv.appendChild(colDiv);
        contentBlocks.historyBlock.appendChild(rowDiv);
        if(elem.fullTank === false) {
            let redBlock = document.createElement('div');
            redBlock.className = "text-danger fw-bold";
            redBlock.textContent = 'underfueled';
            colDiv.prepend(redBlock);
        }
    }
}
// Statistic
// document.getElementById('statisticButton').addEventListener('click', getStatistic);
async function getStatistic() {
    try {
        const userId = getCookie('userId');

        if(!userId){
            console.log('no userId');
            showBlock('loginBlock', authItems);
            return;
        }

        const period = document.getElementById('selectQuantity').value * document.getElementById('selectPeriod').value;
        console.log(period)
    } catch (error) {
        console.error(error)
    }
}