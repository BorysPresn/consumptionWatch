import { getCookie, 
    getAndValidateInputs, 
    insertData, showBlock, 
    clearContentElems, 
    showError, 
    removeError, 
    handleSuccessfullLogin, 
    checkAuthorization,
    fetchRecordData,
    logout
}  from "./functions.js";

let lastMileage = null;

let authItems = Object.values({
    loginBlock : document.getElementById('loginBlock'),
    registerBlock : document.getElementById('registerBlock'),
    mainContentBlock : document.getElementById('mainContentBlock')
});

let contentBlocks = {
    addRecordBlock : document.getElementById('addRecordBlock'),
    historyBlock : document.getElementById('historyBlock'),
    statisticBlock : document.getElementById('statisticBlock'),
    aboutBlock : document.getElementById('aboutBlock'),
    helpBlock : document.getElementById('helpBlock')
};
const contentItems = Object.values(contentBlocks);

//checking authorization
document.addEventListener('DOMContentLoaded', async () => {
    const authorized = checkAuthorization()
    if(authorized){
        showBlock('mainContentBlock', authItems);
        showBlock("addRecordBlock", contentItems);
        const record = await fetchRecordData();
        insertData(record)
    } else {
        logout(authItems);
        return;
    }
});

//Login
document.getElementById('registerLink').addEventListener('click', function() { 
    showBlock('registerBlock', authItems);
    return;
});
document.getElementById('login-form').addEventListener('submit', async function (e){
    e.preventDefault();
    let loginErrorBlock = document.getElementById('loginErrorBlock');
    let loginForm = document.getElementById('login-form');
    const formData = {
        email : loginForm.email.value,
        password : loginForm.password.value,
    };
    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });
    const data = await response.json();
    // console.log(response)
    if(response.ok) {
        await handleSuccessfullLogin(data, authItems, contentItems, loginErrorBlock, loginForm);
        const record = await fetchRecordData(data.userId);
        insertData(record);
        lastMileage = record.totalMileage;
        return;
    } else {
        loginErrorBlock.textContent = data.message;
        return;
    }
});

//Register
document.getElementById('loginLink').addEventListener('click', function() { 
    showBlock('loginBlock', authItems); 
    return;
});
document.getElementById('register-form').addEventListener('submit', async function(e){
    e.preventDefault(); 
    let errorBlock = document.getElementById('registerErrorBlock');
    const registerForm = document.getElementById('register-form');
    const formData = {
        email : registerForm.email.value,
        password : registerForm.password.value,
        initialMileage : parseFloat(registerForm['initial-mileage'].value)
    };
    if(formData.initialMileage < 0 || !formData.initialMileage){
        registerForm['initial-mileage'].classList.add('error');
        errorBlock.textContent = "Only positive numbers are alowed!";
        return;
    }
    // sending data to server
    const response = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });

    const data = await response.json();
    if(response.ok) {
        registerForm['initial-mileage'].classList.remove('error');
        await handleSuccessfullLogin(data, errorBlock, registerForm)
    } else {
        errorBlock.textContent = data.message;
        return;
    }
    // console.log('Response:', {userId, token, message, initialMileage});
});

//logout button

const logoutButtons = document.querySelectorAll('.logout');
logoutButtons.forEach(element => {
    element.addEventListener('click', () => {
        const offcanvasNavbar = document.getElementById('offcanvasNavbar');
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasNavbar);
        if (bsOffcanvas) {
            bsOffcanvas.hide();
        }
        logout(authItems);
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
       
        insertData(data.dataToProcess);
        addRecordForm.submit();
        addRecordForm.reset();
        
        lastMileage = data.totalMileage;
    } catch (error) {
        console.error(error);
    }
})

// History
async function getHistory() {
    try {
        const userId = checkAuthorization();
        if(!userId){
            logout(authItems);
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
        return history;
    } catch (error) {
        console.error(error)
    }
}

function generateHistory(history) {
    contentBlocks.historyBlock.innerHTML = '';
    
    for (let i = 0; i < history.data.length; i++){
        const elem = history.data[i];
        const innerHTMLText = `<div class="row">
                                    ${elem.fullTank === false ? '<div class="text-danger fw-bold"> underfueled </div>' : ''}
                                    ${elem.isSummary === true ? '<div class="text-primary fw-bold"> summary </div>' : ''}
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
        if (history.data[i].isSummary === true  ) {
            //create accordion
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

            const summaryId = history.data[i].summaryId;
            while (history.data[i+1].summaryId === summaryId){
                i++;
                const elem = history.data[i];

                accordionBody.innerHTML += `<div class="col border rounded-1 mt-2 p-2 bg-white">
                                                ${elem.fullTank === false ? '<div class="text-danger fw-bold"> underfueled </div>' : ''}
                                                
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
            
            if(elem.fullTank === false) {
                console.log("element to check fullTant", elem);
                let redBlock = document.createElement('div');
                redBlock.className = "text-danger fw-bold";
                redBlock.textContent = 'underfueled';
                colDiv.prepend(redBlock);
            }
        }
        
        rowDiv.appendChild(colDiv);
        contentBlocks.historyBlock.appendChild(rowDiv);
        
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