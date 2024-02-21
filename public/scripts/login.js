// login 

document.getElementById('login-form').addEventListener('submit', async function (e){
    e.preventDefault();
    
    const formData = {
        email : document.getElementById('login-email').value,
        password : document.getElementById('login-password').value,
    };

    // sending data to server
    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });
    const data = await response.json();
    document.cookie = `token=${data.data.token};path=/;max-age=1800;secure`;
    window.location.href = '/index.html';
    console.log('Response:', data);
});