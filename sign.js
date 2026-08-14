// sign.js


// =========================================
// TOKEN
// =========================================

const params =
    new URLSearchParams(
        window.location.search
    );


const token =
    params.get("token");


// =========================================
// ELEMENTOS
// =========================================

const documentName =
    document.getElementById(
        "documentName"
    );

const courseName =
    document.getElementById(
        "courseName"
    );

const teacherName =
    document.getElementById(
        "teacherName"
    );

const signatureSlot =
    document.getElementById(
        "signatureSlot"
    );

const signMessage =
    document.getElementById(
        "signMessage"
    );

const continueButton =
    document.getElementById(
        "continueButton"
    );


// =========================================
// VERIFICAR SESIÓN
// =========================================

async function loadSession() {

    signMessage.innerHTML =
        "Verificando sesión...";


    if (!token) {

        signMessage.innerHTML =
            "<strong>Error:</strong> No se recibió ningún token.";

        return;

    }


    signMessage.innerHTML =
        "Token recibido. Consultando Supabase...";


    const { data, error } =
        await supabaseClient.rpc(
            "get_signature_session",
            {
                p_token: token
            }
        );


    if (error) {

        console.error(error);

        signMessage.innerHTML = `
            <strong>Error de Supabase:</strong><br><br>

            Código: ${error.code || "N/A"}<br>

            Mensaje: ${error.message || "N/A"}<br>

            Detalles: ${error.details || "N/A"}<br>

            Sugerencia: ${error.hint || "N/A"}
        `;

        return;
    }


    if (!data) {

        signMessage.innerHTML =
            "<strong>Error:</strong> Supabase no encontró esta sesión.";

        return;

    }


    signMessage.innerHTML =
        "Sesión encontrada. Verificando datos...";


    if (data.status !== "PENDING") {

        signMessage.innerHTML =
            `Esta sesión no está disponible. Estado: ${data.status}`;

        return;

    }


    const expiresAt =
        new Date(data.expires_at);


    if (new Date() > expiresAt) {

        signMessage.innerHTML =
            "Esta sesión de firma ha expirado.";

        return;

    }


    const signature =
        data.signature;


    const document =
        signature.document;


    const course =
        document.course;


    const teacher =
        signature.teacher;


    documentName.textContent =
        document.name || "Sin documento";


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


    continueButton.onclick =
        () => {

            window.location.href =
                `sign-document.html?token=${encodeURIComponent(token)}`;

        };

}

    // =====================================
    // COMPROBAR ESTADO
    // =====================================

    if (data.status !== "PENDING") {

        signMessage.textContent =
            "Esta sesión de firma ya no está disponible.";

        return;

    }


    // =====================================
    // COMPROBAR EXPIRACIÓN
    // =====================================

    const expiresAt =
        new Date(data.expires_at);


    if (new Date() > expiresAt) {

        signMessage.textContent =
            "Esta sesión de firma ha expirado.";

        return;

    }


    const signature =
        data.signature;


    const document =
        signature.document;


    const course =
        document.course;


    const teacher =
        signature.teacher;


    // =====================================
    // MOSTRAR INFORMACIÓN
    // =====================================

    documentName.textContent =
        document.name;


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


    continueButton.onclick =
        () => {

            window.location.href =
                `sign-document.html?token=${encodeURIComponent(token)}`;

        };

}


    // =====================================
    // COMPROBAR ESTADO
    // =====================================

    if (
        data.status !== "PENDING"
    ) {

        signMessage.textContent =
            "Esta sesión de firma ya no está disponible.";

        return;

    }


    // =====================================
    // COMPROBAR EXPIRACIÓN
    // =====================================

    const expiresAt =
        new Date(
            data.expires_at
        );


    if (
        new Date() >
        expiresAt
    ) {

        signMessage.textContent =
            "Esta sesión de firma ha expirado.";

        return;

    }


    const signature =
        data.document_signatures;


    const document =
        signature.documents;


    const course =
        document.courses;


    const teacher =
        signature.teachers;


    // =====================================
    // MOSTRAR INFORMACIÓN
    // =====================================

    documentName.textContent =
        document.name;


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


    continueButton.onclick =
        () => {

            window.location.href =
                `sign-document.html?token=${token}`;

        };

}


// =========================================
// INICIAR
// =========================================

loadSession();
