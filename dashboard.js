// dashboard.js


const profileData =
    localStorage.getItem("userProfile");


if (!profileData) {

    window.location.href = "index.html";

}


const profile =
    JSON.parse(profileData);


const welcomeTitle =
    document.getElementById("welcomeTitle");

const userRole =
    document.getElementById("userRole");


welcomeTitle.textContent =
    `Bienvenido, ${profile.full_name}`;


const roleNames = {

    admin: "Administrador",

    operator: "Operador",

    teacher: "Profesor"

};


userRole.textContent =
    roleNames[profile.role] || profile.role;



// Cerrar sesión

const logoutButton =
    document.getElementById("logoutButton");


logoutButton.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    localStorage.removeItem("userProfile");

    window.location.href = "index.html";

});