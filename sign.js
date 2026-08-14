// =========================================
// SIGN.JS
// =========================================

const params = new URLSearchParams(
    window.location.search
);

const token = params.get("token");


// =========================================
// ELEMENTOS
// =========================================

const documentName =
    document.getElementById("documentName");

const courseName =
    document.getElementById("courseName");

const teacherName =
    document.getElementById("teacherName");

const signatureSlot =
    document.getElementById("signatureSlot");

const signMessage =
    document.getElementById("signMessage");

const continueButton =
    document.getElementById("continueButton");


// =========================================
// DIAGNÓSTICO
// =========================================

function showError(message) {

    signMessage.innerHTML = `
        <strong>Error:</strong><br><br>
        ${message}
    `;

}


// =========================================
// CARGAR SESIÓN
// =========================================

async function loadSession() {

    try {

        signMessage.textContent =
            "1. Iniciando...";


        if (!token) {

            showError(
                "No se recibió ningún token en la URL."
            );

            return;

        }


        signMessage.textContent =
            "2. Token recibido correctamente.";


        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            showError(
                "supabaseClient no está definido. Revisa supabase.js."
            );

            return;

        }


        signMessage.textContent =
            "3. Conectando con Supabase...";


        const { data, error } =
            await supabaseClient.rpc(
                "get_signature_session",
                {
                    p_token: token
                }
            );


        signMessage.textContent =
            "4. Respuesta recibida de Supabase.";


        if (error) {

            showError(`
                Código: ${error.code || "N/A"}<br>
                Mensaje: ${error.message || "N/A"}<br>
                Detalles: ${error.details || "N/A"}
            `);

            return;

        }


        if (!data) {

            showError(
                "Supabase no encontró la sesión."
            );

            return;

        }


        signMessage.textContent =
            "5. Sesión encontrada.";


        if (data.status !== "WAITING") {

            showError(
                `La sesión no está pendiente. Estado: ${data.status}`
            );

            return;

        }


        const expiresAt =
            new Date(data.expires_at);


        if (new Date() > expiresAt) {

            showError(
                "Esta sesión ha expirado."
            );

            return;

        }


        // =====================================
        // DATOS
        // =====================================

        const signature =
            data.signature;

        const document =
            signature.document;

        const course =
            document.course;

        const teacher =
            signature.teacher;


        documentName.textContent =
            document.name ||
            "Sin documento";


        courseName.textContent =
            course
                ? `${course.name} ${course.section || ""}`
                : "Sin curso";


        teacherName.textContent =
            teacher
                ? teacher.full_name
                : "Profesor";


        signatureSlot.textContent =
            signature.signature_slot ===
            "BEFORE_RECESS"

                ? "Antes del primer receso"

                : "Después del primer receso";


        signMessage.textContent =
            "Sesión válida. Puedes continuar.";


        continueButton.disabled =
            false;


        continueButton.onclick = function () {

            window.location.href =
                `sign-document.html?token=${encodeURIComponent(token)}`;

        };


    } catch (error) {

        console.error(error);

        showError(`
            Error inesperado:<br><br>
            ${error.message || error}
        `);

    }

}


// =========================================
// INICIAR
// =========================================

loadSession();
