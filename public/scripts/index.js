// cheking cookies for login

// main logic

//register 

document.getElementById('registration-form').addEventListener('submit', async function(e){
    e.preventDefault(); // Предотвращаем стандартное поведение формы

    const formData = {
        email : document.getElementById('register-email').value,
        password : document.getElementById('register-password').value,
        initialMileage : document.getElementById('initial-mileage').value
    };

    // Отправляем данные на сервер
    const response = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });
    const data = await response.json();
    console.log('Response:', data);
});
