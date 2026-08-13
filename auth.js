// auth.js

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");


loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginButton.disabled = true;
    loginButton.textContent = "Iniciando sesión...";
    loginMessage.textContent = "";


    // Iniciar sesión
    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });


    if (error) {

        console.error(error);

        loginMessage.textContent =
            "No se pudo iniciar sesión. Verifica tus datos.";

        loginButton.disabled = false;
        loginButton.textContent = "Iniciar sesión";

        return;
    }


    // Obtener perfil
    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();


    if (profileError) {

        console.error(profileError);

        loginMessage.textContent =
            "La cuenta existe, pero no tiene un perfil configurado.";

        await supabaseClient.auth.signOut();

        loginButton.disabled = false;
        loginButton.textContent = "Iniciar sesión";

        return;
    }


    console.log("Usuario:", data.user);
    console.log("Perfil:", profile);


    // Guardar información para la aplicación
    localStorage.setItem(
        "userProfile",
        JSON.stringify(profile)
    );


    // Ir al Dashboard
    window.location.href = "dashboard.html";
});