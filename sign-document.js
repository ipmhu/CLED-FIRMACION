// =========================================
// SIGN-DOCUMENT.JS
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

const pdfViewer =
    document.getElementById(
        "pdfViewer"
    );

const canvas =
    document.getElementById(
        "signatureCanvas"
    );

const clearButton =
    document.getElementById(
        "clearSignature"
    );

const finishButton =
    document.getElementById(
        "finishSignature"
    );


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
// CARGAR DOCUMENTO
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


        // =================================
        // OBTENER SESIÓN
        // =================================

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


        // =================================
        // DATOS
        // =================================

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
        // OBTENER RUTA DEL PDF
        // =================================

        const filePath =
            document.original_file_path;


        if (!filePath) {

            showError(
                "El documento no tiene un archivo PDF asociado."
            );

            return;

        }


        console.log(
            "Ruta del PDF:",
            filePath
        );


        // =================================
        // CREAR URL TEMPORAL
        // =================================

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
                "Error Storage:",
                signedError
            );

            showError(
                `No se pudo abrir el PDF: ${signedError.message}`
            );

            return;

        }


        if (!signedData?.signedUrl) {

            showError(
                "Supabase no generó una URL para el PDF."
            );

            return;

        }


        console.log(
            "URL PDF:",
            signedData.signedUrl
        );


        pdfViewer.src =
            signedData.signedUrl;


        signMessage.textContent =
            "Documento listo. Puedes firmarlo.";


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
// CANVAS
// =========================================

function setupSignatureCanvas() {

    const ratio =
        Math.max(
            window.devicePixelRatio || 1,
            1
        );


    const width =
        canvas.offsetWidth;


    const height =
        220;


    canvas.width =
        width * ratio;


    canvas.height =
        height * ratio;


    const context =
        canvas.getContext("2d");


    context.scale(
        ratio,
        ratio
    );


    context.lineWidth =
        2;


    context.lineCap =
        "round";


    context.lineJoin =
        "round";


    let drawing =
        false;


    function getPosition(event) {

        const rect =
            canvas.getBoundingClientRect();


        if (
            event.touches &&
            event.touches.length
        ) {

            return {

                x:
                    event.touches[0].clientX -
                    rect.left,

                y:
                    event.touches[0].clientY -
                    rect.top

            };

        }


        return {

            x:
                event.clientX -
                rect.left,

            y:
                event.clientY -
                rect.top

        };

    }


    function startDrawing(event) {

        event.preventDefault();

        drawing =
            true;


        const position =
            getPosition(event);


        context.beginPath();


        context.moveTo(
            position.x,
            position.y
        );

    }


    function draw(event) {

        if (!drawing) {
            return;
        }


        event.preventDefault();


        const position =
            getPosition(event);


        context.lineTo(
            position.x,
            position.y
        );


        context.stroke();

    }


    function stopDrawing() {

        drawing =
            false;

    }


    canvas.addEventListener(
        "mousedown",
        startDrawing
    );


    canvas.addEventListener(
        "mousemove",
        draw
    );


    canvas.addEventListener(
        "mouseup",
        stopDrawing
    );


    canvas.addEventListener(
        "mouseleave",
        stopDrawing
    );


    canvas.addEventListener(
        "touchstart",
        startDrawing,
        {
            passive: false
        }
    );


    canvas.addEventListener(
        "touchmove",
        draw,
        {
            passive: false
        }
    );


    canvas.addEventListener(
        "touchend",
        stopDrawing
    );

}


// =========================================
// LIMPIAR FIRMA
// =========================================

clearButton.addEventListener(
    "click",
    () => {

        const context =
            canvas.getContext("2d");


        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

    }
);


// =========================================
// FINALIZAR FIRMA
// =========================================

finishButton.addEventListener(
    "click",
    async () => {

        signMessage.textContent =
            "Guardando firma...";


        finishButton.disabled =
            true;


        try {

            const signatureImage =
                canvas.toDataURL(
                    "image/png"
                );


            console.log(
                "Firma preparada:",
                signatureImage.length
            );


            // =================================
            // POR AHORA
            // =================================

            signMessage.textContent =
                "Firma preparada correctamente.";

            finishButton.disabled =
                false;


        }

        catch (error) {

            console.error(error);

            showError(
                error.message
            );


            finishButton.disabled =
                false;

        }

    }
);


// =========================================
// INICIAR
// =========================================

loadDocument();
