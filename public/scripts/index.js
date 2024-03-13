import { getCookie, getAndValidateInputs, insertDataToHtml, showBlock }  from "./functions.js"
let lastMileage = null;
let blocks = {
    addRecordBlock : document.getElementById('addRecordBlock'),
    historyBlock : document.getElementById('historyBlock'),
    statisticBlock : document.getElementById('statisticBlock'),
    aboutBlock : document.getElementById('aboutBlock'),
    helpBlock : document.getElementById('helpBlock')
};

const navigateItems = Object.values(blocks);
console.log(navigateItems)
// Sidebar 

let sidebarArray = document.querySelectorAll('.sidebar');
sidebarArray.forEach(elem => elem.addEventListener('click', (e) =>{
    const target = e.target.closest('.nav-item');
    if(target){
        //console.log(target.id)
        document.querySelectorAll('.nav-item.active').forEach(elem => elem.classList.remove('active'));
        target.classList.add('active');
        showBlock(target.dataset.target, navigateItems);
    }
    
}));

//checking authorization

document.addEventListener('DOMContentLoaded', async function(){
    const cookie = getCookie('token');
    
    if(!cookie) {
        window.location.href = '/login.html';
    } else {
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

            const response = await fetch(`/users?userId=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type' : 'application/json',
                },
            });
            if(!response.ok) {
                console.log(response.status)
                return;
            } else {    
                const data = await response.json();
                data.totalMileage = data.initialMileage;
                delete data.initialMileage;
                
                insertDataToHtml(data);
                return;
            }

        } else {
            const data = await response.json();
            // console.log(data);
            insertDataToHtml(data);
            lastMileage = data.totalMileage
            // console.log(lastMileage)
            return;
        }
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

    const formData = getAndValidateInputs(inputIds, userId, lastMileage);

    if(!formData){
        console.log('validation failed');
        return;
    } 

    const response = await fetch('/addRecord', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });
    const data = await response.json();
    
    insertDataToHtml(data);
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
    response.data.forEach(elem => {
        historyBlock.innerHTML += `<div class="row px-1">
                                        <div class="col border rounded-1 mt-2 p-2">
                                            <div class="row">
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
                                            </div>
                                        </div>
                                    </div>`
    })
})