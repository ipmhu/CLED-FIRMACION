// =========================================
// SIGN-DOCUMENT.JS
// =========================================

const params =
    new URLSearchParams(window.location.search);

const token =
    params.get("token");


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

const pdfViewer =
    document.getElementById("pdfViewer");

const canvas =
    document.getElementById("signatureCanvas");

const clearButton =
    document.getElementById("clearSignature");

const finishButton =
    document.getElementById("finishSignature");


// =========================================
// VARIABLES DE FIRMA
// =========================================

let context;
let drawing = false;
let hasSignature = false;


// =========================================
// ERROR
// =========================================

function showError(message) {

    signMessage.innerHTML = `
        <strong>Error:</strong><br><br>
        ${message}
    `;

}


// =========================================
// CONFIGURAR CANVAS
// =========================================

function setupSignatureCanvas() {

    const rect =
        canvas.getBoundingClientRect();

    const ratio =
        window.devicePixelRatio || 1;


    canvas.width =
        rect.width * ratio;

    canvas.height =
        rect.height * ratio;


    context =
        canvas.getContext("2d");


    context.scale(
        ratio,
        ratio
    );


    context.lineWidth =
        2.5;

    context.lineCap =
        "round";

    context.lineJoin =
        "round";


    /*
     * IMPORTANTE:
     * evita que Safari/Chrome interpreten
     * el movimiento como desplazamiento
     * de la página.
     */

    canvas.style.touchAction =
        "none";


    canvas.addEventListener(
        "pointerdown",
        startDrawing
    );


    canvas.addEventListener(
        "pointermove",
        draw
    );


    canvas.addEventListener(
        "pointerup",
        stopDrawing
    );


    canvas.addEventListener(
        "pointercancel",
        stopDrawing
    );


    canvas.addEventListener(
        "pointerleave",
        stopDrawing
    );

}


// =========================================
// POSICIÓN DEL PUNTERO
// =========================================

function getPointerPosition(event) {

    const rect =
        canvas.getBoundingClientRect();


    return {

        x:
            event.clientX -
            rect.left,

        y:
            event.clientY -
            rect.top

    };

}


// =========================================
// INICIAR DIBUJO
// =========================================

function startDrawing(event) {

    event.preventDefault();


    drawing =
        true;


    hasSignature =
        true;


    canvas.setPointerCapture(
        event.pointerId
    );


    const position =
        getPointerPosition(event);


    context.beginPath();


    context.moveTo(
        position.x,
        position.y
    );

}


// =========================================
// DIBUJAR
// =========================================

function draw(event) {

    if (!drawing) {
        return;
    }


    event.preventDefault();


    const position =
        getPointerPosition(event);


    context.lineTo(
        position.x,
        position.y
    );


    context.stroke();

}


// =========================================
// TERMINAR DIBUJO
// =========================================

function stopDrawing(event) {

    if (!drawing) {
        return;
    }


    drawing =
        false;


    if (
        event.pointerId !== undefined &&
        canvas.hasPointerCapture(
            event.pointerId
        )
    ) {

        canvas.releasePointerCapture(
            event.pointerId
        );

    }

}


// =========================================
// LIMPIAR FIRMA
// =========================================

clearButton.addEventListener(
    "click",
    () => {

        if (!context) {
            return;
        }


        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        hasSignature =
            false;

    }
);


// =========================================
// CARGAR SESIÓN
// =========================================

async function loadDocument() {

    try {

        if (!token) {

            showError(
                "No se recibió el token."
            );

            return;

        }


        signMessage.textContent =
            "Verificando documento...";


        const { data, error } =
            await supabaseClient.rpc(
                "get_signature_session",
                {
                    p_token: token
                }
            );


        if (error) {

            console.error(error);

            showError(
                error.message
            );

            return;

        }


        if (!data) {

            showError(
                "No se encontró la sesión."
            );

            return;

        }


        if (
            data.status !==
            "WAITING"
        ) {

            showError(
                `La sesión no está pendiente. Estado: ${data.status}`
            );

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


        // =================================
        // PDF
        // =================================

        const filePath =
            document.original_file_path;


        if (!filePath) {

            showError(
                "El documento no tiene un archivo PDF asociado."
            );

            return;

        }


        const {
            data: signedData,
            error: signedError
        } =
            await supabaseClient
                .storage
                .from("documents")
                .createSignedUrl(
                    filePath,
                    3600
                );


        if (signedError) {

            console.error(
                signedError
            );

            showError(
                `No se pudo abrir el PDF: ${signedError.message}`
            );

            return;

        }


        pdfViewer.src =
            signedData.signedUrl;


        signMessage.textContent =
            "Documento listo. Puedes firmarlo.";


        // =================================
        // CANVAS
        // =================================

        setupSignatureCanvas();

    }

    catch (error) {

        console.error(error);

        showError(
            error.message ||
            "Error inesperado."
        );

    }

}


// =========================================
// FINALIZAR
// =========================================

finishButton.addEventListener(
    "click",
    async () => {

        if (!hasSignature) {

            signMessage.textContent =
                "Debes realizar tu firma antes de continuar.";

            return;

        }


        const signatureImage =
            canvas.toDataURL(
                "image/png"
            );


        console.log(
            "Firma capturada correctamente."
        );


        signMessage.textContent =
            "Firma capturada correctamente.";

    }
);


// =========================================
// INICIAR
// =========================================

loadDocument();
