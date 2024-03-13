// login 

document.getElementById('login-form').addEventListener('submit', async function (e){
    e.preventDefault();
    
    const formData = {
        email : document.getElementById('login-email').value,
        password : document.getElementById('login-password').value,
    };
    console.log(formData)
    // sending data to server
    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });
    const {userId, token, message, initialMileage} = await response.json();
    if(response.ok) {
        sessionStorage.setItem('initialMileage', initialMileage);
        document.cookie = `token=${token};path=/;max-age=1800;secure`;
        document.cookie = `userId=${userId};path=/;max-age=1800;secure`;
        window.location.href = '/index.html';
        return;
    } else {
        console.log(response, message)
        document.querySelector('.error-block').textContent = message;
        return;
    }
});