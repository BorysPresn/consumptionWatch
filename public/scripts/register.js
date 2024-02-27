//register 

document.getElementById('registration-form').addEventListener('submit', async function(e){
    e.preventDefault(); // Предотвращаем стандартное поведение формы

    const formData = {
        email : document.getElementById('register-email').value,
        password : document.getElementById('register-password').value,
        initialMileage : +document.getElementById('initial-mileage').value
    };

    // sending data to server
    const response = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });
    const data = await response.json();
    document.cookie = `token=${data.token};path=/;max-age=1800;secure;HttpOnly`;
    document.cookie = `userId=${data.userId};path=/max-age=1800;secure;httpOnly`;
    window.location.href = '/index.html';

    console.log('Response:', data);
});


