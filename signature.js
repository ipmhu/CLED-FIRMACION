// signature.js


const params =
    new URLSearchParams(window.location.search);

const signatureId =
    params.get("id");


// =========================================
// ELEMENTOS
// =========================================

const signatureTitle =
    document.getElementById("signatureTitle");

const signatureTeacher =
    document.getElementById("signatureTeacher");

const signatureDescription =
    document.getElementById("signatureDescription");

const qrContainer =
    document.getElementById("qrContainer");

const sessionStatus =
    document.getElementById("sessionStatus");

const signatureMessage =
    document.getElementById("signatureMessage");


// =========================================
// CARGAR FIRMA
// =========================================

async function loadSignature() {

    const { data, error } =
        await supabaseClient
            .from("document_signatures")
            .select(`
                *,
                documents (
                    name,
                    course_id,
                    courses (
                        name,
                        section
                    )
                ),
                teachers (
                    full_name
                )
            `)
            .eq("id", signatureId)
            .single();


    if (error) {

        console.error(error);

        signatureTitle.textContent =
            "Firma no encontrada";

        return;
    }


    const isBefore =
        data.signature_slot ===
        "BEFORE_RECESS";


    signatureTitle.textContent =
        isBefore
            ? "Firma 1 — Antes del primer receso"
            : "Firma 2 — Después del primer receso";


    signatureTeacher.textContent =
        data.teachers
            ? data.teachers.full_name
            : "Profesor no asignado";


    signatureDescription.textContent =
        data.documents
            ? data.documents.name
            : "Documento";


    return data;

}


// =========================================
// CREAR SESIÓN
// =========================================

async function createSignatureSession() {

    signatureMessage.textContent =
        "Creando sesión...";

    console.log("signatureId:", signatureId);


    const { data, error } =
        await supabaseClient
            .from("signature_sessions")
            .insert({
                signature_id: Number(signatureId)
            })
            .select()
            .single();


    console.log("Respuesta Supabase:", {
        data,
        error
    });


    if (error) {

        console.error(
            "ERROR COMPLETO:",
            error
        );

        signatureMessage.textContent =
            `Error: ${error.message}`;

        return;
    }


    console.log(
        "Sesión creada:",
        data
    );


    generateQR(data.token);

}


// =========================================
// GENERAR QR
// =========================================

function generateQR(token) {

const signingURL =
    `https://ipmhu.github.io/sign.html?token=${encodeURIComponent(token)}`;


    console.log("URL DEL QR:", signingURL);


    qrContainer.innerHTML = "";


    new QRCode(
        qrContainer,
        {
            text: signingURL,

            width: 240,

            height: 240,

            correctLevel:
                QRCode.CorrectLevel.M
        }
    );


    sessionStatus.textContent =
        "Esperando firma";


    signatureMessage.textContent =
        "Escanea este código QR desde el celular del profesor.";


    listenForSignature();

}


// =========================================
// ESCUCHAR CAMBIOS
// =========================================

function listenForSignature() {

    supabaseClient
        .channel(
            `signature-${signatureId}`
        )
        .on(
            "postgres_changes",
            {
                event: "UPDATE",

                schema: "public",

                table: "signature_sessions",

                filter:
                    `signature_id=eq.${signatureId}`
            },

            payload => {

                if (
                    payload.new.status ===
                    "SIGNED"
                ) {

                    sessionStatus.textContent =
                        "Firma completada";

                    signatureMessage.textContent =
                        "El profesor ha firmado correctamente.";

                    // Más adelante actualizaremos
                    // automáticamente el documento.

                }

            }
        )
        .subscribe();

}


// =========================================
// INICIAR
// =========================================

async function init() {

    if (!signatureId) {

        signatureTitle.textContent =
            "Sesión inválida";

        return;

    }


    await loadSignature();

}


// =========================================
// BOTÓN
// =========================================

document
    .getElementById("startSessionButton")
    .addEventListener(
        "click",
        createSignatureSession
    );


init();
