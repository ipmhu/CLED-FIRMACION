// =========================================
// DOCUMENT.JS
// =========================================


// =========================================
// ID DEL DOCUMENTO
// =========================================

const params =
    new URLSearchParams(
        window.location.search
    );

const documentId =
    params.get("id");


if (!documentId) {

    window.location.href =
        "documents.html";

    throw new Error(
        "No se recibió documentId."
    );

}


// =========================================
// ELEMENTOS PRINCIPALES
// =========================================

const documentTitle =
    document.getElementById(
        "documentTitle"
    );

const courseName =
    document.getElementById(
        "courseName"
    );

const documentStatus =
    document.getElementById(
        "documentStatus"
    );

const pdfViewer =
    document.getElementById(
        "pdfViewer"
    );

const signatureContainer =
    document.getElementById(
        "signatureContainer"
    );

const documentMessage =
    document.getElementById(
        "documentMessage"
    );


// =========================================
// DOCUMENTO FIRMADO
// =========================================

const signedDocumentContainer =
    document.getElementById(
        "signedDocumentContainer"
    );

const viewSignedDocumentButton =
    document.getElementById(
        "viewSignedDocumentButton"
    );

const signedDocumentMessage =
    document.getElementById(
        "signedDocumentMessage"
    );


// =========================================
// ELEMENTOS DEL CONFIGURADOR
// =========================================

const configureSignaturesButton =
    document.getElementById(
        "configureSignaturesButton"
    );

const signatureConfigurator =
    document.getElementById(
        "signatureConfigurator"
    );

const pdfConfigScroll =
    document.getElementById(
        "pdfConfigScroll"
    );

const selectBeforeSignature =
    document.getElementById(
        "selectBeforeSignature"
    );

const selectAfterSignature =
    document.getElementById(
        "selectAfterSignature"
    );

const saveSignaturePositions =
    document.getElementById(
        "saveSignaturePositions"
    );

const closeSignatureConfigurator =
    document.getElementById(
        "closeSignatureConfigurator"
    );

const configMessage =
    document.getElementById(
        "configMessage"
    );


// =========================================
// VARIABLES
// =========================================

let pdfDocument =
    null;

let signatureMarkers =
    {};

let selectedSignatureSlot =
    "BEFORE_RECESS";


// =========================================
// CONFIGURAR PDF.JS
// =========================================

if (
    typeof pdfjsLib !==
    "undefined"
) {

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

}


// =========================================
// CARGAR DOCUMENTO
// =========================================

async function loadDocument() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("documents")
                .select(`
                    *,
                    courses (
                        name,
                        section
                    )
                `)
                .eq(
                    "id",
                    documentId
                )
                .single();


        if (error) {

            console.error(
                "Error cargando documento:",
                error
            );

            documentTitle.textContent =
                "Documento no encontrado";

            documentMessage.textContent =
                error.message;

            return;

        }


        // =====================================
        // INFORMACIÓN
        // =====================================

        documentTitle.textContent =
            data.name ||
            "Sin nombre";


        const course =
            data.courses;


        courseName.textContent =
            course
                ? `${course.name} ${course.section || ""}`
                : "Sin curso";


        updateDocumentStatus(
            data.status
        );


        // =====================================
        // PDF ORIGINAL
        // =====================================

        if (
            !data.original_file_path
        ) {

            documentMessage.textContent =
                "El documento no tiene un archivo PDF asociado.";

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
                    data.original_file_path,
                    3600
                );


        if (signedError) {

            console.error(
                "Error creando URL del PDF:",
                signedError
            );

            documentMessage.textContent =
                "No se pudo abrir el PDF.";

            return;

        }


        pdfViewer.src =
            signedData.signedUrl;


    }

    catch (error) {

        console.error(
            "Error inesperado cargando documento:",
            error
        );

        documentTitle.textContent =
            "Error cargando documento";

    }

}


// =========================================
// CARGAR FIRMAS
// =========================================

async function loadSignatures() {

    signatureContainer.innerHTML = `
        <div class="loading">
            Cargando firmas...
        </div>
    `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("document_signatures")
                .select(`
                    *,
                    teachers (
                        full_name
                    )
                `)
                .eq(
                    "document_id",
                    documentId
                )
                .order("id");


        if (error) {

            console.error(
                "Error cargando firmas:",
                error
            );

            signatureContainer.innerHTML = `
                <p class="error-message">
                    No se pudieron cargar las firmas.
                </p>
            `;

            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            signatureContainer.innerHTML = `
                <p>
                    Este documento no tiene firmas configuradas.
                </p>
            `;

            return;

        }


        signatureContainer.innerHTML =
            "";


        data.forEach(
            signature => {

                const isBefore =
                    signature.signature_slot ===
                    "BEFORE_RECESS";


                const title =
                    isBefore
                        ? "Antes del primer receso"
                        : "Después del primer receso";


                const number =
                    isBefore
                        ? "FIRMA 1"
                        : "FIRMA 2";


                const teacher =
                    signature.teachers;


                const teacherName =
                    teacher
                        ? teacher.full_name
                        : "Profesor no asignado";


                const isSigned =
                    signature.status ===
                    "COMPLETED";


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "document-signature-card";


                card.innerHTML = `

                    <div class="signature-card-info">

                        <span class="slot-number">
                            ${number}
                        </span>

                        <h3>
                            ${title}
                        </h3>

                        <p>
                            ${teacherName}
                        </p>

                    </div>


                    <div class="signature-card-action">

                        <span class="
                            status-badge
                            ${isSigned
                                ? "assigned"
                                : "pending"}
                        ">

                            ${isSigned
                                ? "Firmado"
                                : "Pendiente"}

                        </span>


                        ${
                            isSigned
                                ? ""
                                : `
                                    <button
                                        type="button"
                                        onclick="startSignature(${signature.id})"
                                    >
                                        Iniciar firma
                                    </button>
                                `
                        }

                    </div>

                `;


                signatureContainer.appendChild(
                    card
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Error inesperado cargando firmas:",
            error
        );

        signatureContainer.innerHTML = `
            <p class="error-message">
                No se pudieron cargar las firmas.
            </p>
        `;

    }

}


// =========================================
// INICIAR FIRMA
// =========================================

function startSignature(
    signatureId
) {

    window.location.href =
        `signature.html?id=${signatureId}`;

}


// =========================================
// ESTADO DEL DOCUMENTO
// =========================================

function updateDocumentStatus(
    status
) {

    const statusNames = {

        PENDING:
            "Pendiente",

        PARTIALLY_SIGNED:
            "Firmado parcialmente",

        COMPLETED:
            "Completado"

    };


    const statusClasses = {

        PENDING:
            "pending",

        PARTIALLY_SIGNED:
            "partial",

        COMPLETED:
            "completed"

    };


    documentStatus.textContent =
        statusNames[status] ||
        status ||
        "Pendiente";


    documentStatus.className =
        `status-badge ${
            statusClasses[status] ||
            "pending"
        }`;

}


// =========================================
// ABRIR CONFIGURADOR
// =========================================

if (
    configureSignaturesButton
) {

    configureSignaturesButton.addEventListener(
        "click",
        openSignatureConfigurator
    );

}


async function openSignatureConfigurator() {

    try {

        signatureConfigurator.classList.remove(
            "hidden"
        );


        configMessage.textContent =
            "Cargando documento...";


        const {
            data,
            error
        } =
            await supabaseClient
                .from("documents")
                .select("*")
                .eq(
                    "id",
                    documentId
                )
                .single();


        if (error) {

            throw error;

        }


        if (
            !data.original_file_path
        ) {

            throw new Error(
                "El documento no tiene un PDF asociado."
            );

        }


        // =====================================
        // URL TEMPORAL DEL PDF
        // =====================================

        const {
            data: signedData,
            error: signedError
        } =
            await supabaseClient
                .storage
                .from("documents")
                .createSignedUrl(
                    data.original_file_path,
                    3600
                );


        if (signedError) {

            throw signedError;

        }


        await renderConfigurationPDF(
            signedData.signedUrl
        );


        await loadExistingSignaturePositions();


        configMessage.textContent =
            "Selecciona FIRMA 1 o FIRMA 2 y haz clic donde quieras colocarla.";

    }

    catch (error) {

        console.error(
            "Error abriendo configurador:",
            error
        );

        configMessage.textContent =
            `Error: ${error.message}`;

    }

}


// =========================================
// RENDERIZAR PDF
// =========================================

async function renderConfigurationPDF(
    pdfUrl
) {

    pdfConfigScroll.innerHTML = `
        <div class="loading">
            Cargando PDF...
        </div>
    `;


    try {

        const response =
            await fetch(pdfUrl);


        if (!response.ok) {

            throw new Error(
                `No se pudo descargar el PDF. HTTP ${response.status}`
            );

        }


        const pdfData =
            await response.arrayBuffer();


        if (
            !pdfData ||
            pdfData.byteLength === 0
        ) {

            throw new Error(
                "El PDF descargado está vacío."
            );

        }


        pdfDocument =
            await pdfjsLib
                .getDocument({
                    data: pdfData
                })
                .promise;


        pdfConfigScroll.innerHTML =
            "";


        // =====================================
        // RENDERIZAR TODAS LAS PÁGINAS
        // =====================================

        for (
            let pageNumber = 1;
            pageNumber <=
            pdfDocument.numPages;
            pageNumber++
        ) {

            const page =
                await pdfDocument.getPage(
                    pageNumber
                );


            const scale =
                1.2;


            const viewport =
                page.getViewport({
                    scale
                });


            const pageContainer =
                document.createElement(
                    "div"
                );


            pageContainer.className =
                "pdf-config-page";


            pageContainer.dataset.page =
                pageNumber;


            pageContainer.style.width =
                `${viewport.width}px`;


            pageContainer.style.height =
                `${viewport.height}px`;


            const canvas =
                document.createElement(
                    "canvas"
                );


            canvas.width =
                viewport.width;


            canvas.height =
                viewport.height;


            canvas.style.width =
                `${viewport.width}px`;


            canvas.style.height =
                `${viewport.height}px`;


            pageContainer.appendChild(
                canvas
            );


            pdfConfigScroll.appendChild(
                pageContainer
            );


            const context =
                canvas.getContext(
                    "2d"
                );


            await page.render({

                canvasContext:
                    context,

                viewport:
                    viewport

            }).promise;

        }

    }

    catch (error) {

        console.error(
            "Error renderizando PDF:",
            error
        );


        pdfConfigScroll.innerHTML = `
            <div class="error-message">
                <strong>
                    No se pudo cargar el PDF.
                </strong>

                <br><br>

                ${error.message}
            </div>
        `;


        throw error;

    }

}


// =========================================
// CARGAR POSICIONES EXISTENTES
// =========================================

async function loadExistingSignaturePositions() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("document_signatures")
            .select(`
                id,
                signature_slot,
                signature_page,
                signature_x,
                signature_y,
                signature_width,
                signature_height
            `)
            .eq(
                "document_id",
                documentId
            );


    if (error) {

        console.error(
            "Error cargando posiciones:",
            error
        );

        return;

    }


    signatureMarkers =
        {};


    if (!data) {
        return;
    }


    data.forEach(
        signature => {

            if (
                signature.signature_page
            ) {

                createSignatureMarker(
                    signature
                );

            }

        }
    );

}


// =========================================
// SELECCIONAR FIRMA 1
// =========================================

if (
    selectBeforeSignature
) {

    selectBeforeSignature.addEventListener(
        "click",
        () => {

            selectedSignatureSlot =
                "BEFORE_RECESS";


            selectBeforeSignature.classList.add(
                "active"
            );


            selectAfterSignature.classList.remove(
                "active"
            );


            configMessage.textContent =
                "FIRMA 1 seleccionada. Haz clic en el documento.";

        }
    );

}


// =========================================
// SELECCIONAR FIRMA 2
// =========================================

if (
    selectAfterSignature
) {

    selectAfterSignature.addEventListener(
        "click",
        () => {

            selectedSignatureSlot =
                "AFTER_RECESS";


            selectAfterSignature.classList.add(
                "active"
            );


            selectBeforeSignature.classList.remove(
                "active"
            );


            configMessage.textContent =
                "FIRMA 2 seleccionada. Haz clic en el documento.";

        }
    );

}


// =========================================
// COLOCAR FIRMA CON CLIC
// =========================================

if (
    pdfConfigScroll
) {

    pdfConfigScroll.addEventListener(
        "click",
        event => {

            const page =
                event.target.closest(
                    ".pdf-config-page"
                );


            if (!page) {
                return;
            }


            if (
                event.target.closest(
                    ".signature-marker"
                )
            ) {

                return;

            }


            const existing =
                signatureMarkers[
                    selectedSignatureSlot
                ];


            if (existing) {

                configMessage.textContent =
                    "Esta firma ya está colocada. Puedes arrastrarla.";

                return;

            }


            const rect =
                page.getBoundingClientRect();


            const x =
                Math.max(
                    0,
                    event.clientX -
                    rect.left -
                    90
                );


            const y =
                Math.max(
                    0,
                    event.clientY -
                    rect.top -
                    35
                );


            createSignatureMarker({

                id:
                    null,

                signature_slot:
                    selectedSignatureSlot,

                signature_page:
                    Number(
                        page.dataset.page
                    ),

                signature_x:
                    x,

                signature_y:
                    y,

                signature_width:
                    180,

                signature_height:
                    70

            });


            configMessage.textContent =
                "Firma colocada. Puedes arrastrarla para ajustar su posición.";

        }
    );

}


// =========================================
// CREAR MARCADOR
// =========================================

function createSignatureMarker(
    signature
) {

    const oldMarker =
        signatureMarkers[
            signature.signature_slot
        ];


    if (oldMarker) {

        oldMarker.remove();

    }


    const page =
        document.querySelector(
            `.pdf-config-page[data-page="${signature.signature_page}"]`
        );


    if (!page) {

        console.warn(
            "No se encontró la página:",
            signature.signature_page
        );

        return;

    }


    const marker =
        document.createElement(
            "div"
        );


    marker.className =
        "signature-marker";


    marker.classList.add(
        signature.signature_slot ===
        "BEFORE_RECESS"
            ? "before"
            : "after"
    );


    marker.innerHTML = `

        <strong>
            ${
                signature.signature_slot ===
                "BEFORE_RECESS"
                    ? "FIRMA 1"
                    : "FIRMA 2"
            }
        </strong>

        <small>
            Arrastra aquí
        </small>

    `;


    const width =
        Number(
            signature.signature_width
        ) || 180;


    const height =
        Number(
            signature.signature_height
        ) || 70;


    const x =
        Number(
            signature.signature_x
        ) || 20;


    const y =
        Number(
            signature.signature_y
        ) || 20;


    marker.style.width =
        `${width}px`;


    marker.style.height =
        `${height}px`;


    marker.style.left =
        `${x}px`;


    marker.style.top =
        `${y}px`;


    page.appendChild(
        marker
    );


    signatureMarkers[
        signature.signature_slot
    ] =
        marker;


    makeMarkerDraggable(
        marker
    );

}


// =========================================
// ARRASTRAR MARCADOR
// =========================================

function makeMarkerDraggable(
    marker
) {

    let dragging =
        false;

    let offsetX =
        0;

    let offsetY =
        0;


    marker.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();


            dragging =
                true;


            const rect =
                marker.getBoundingClientRect();


            offsetX =
                event.clientX -
                rect.left;


            offsetY =
                event.clientY -
                rect.top;


            marker.setPointerCapture(
                event.pointerId
            );

        }
    );


    marker.addEventListener(
        "pointermove",
        event => {

            if (!dragging) {
                return;
            }


            const page =
                marker.parentElement;


            const pageRect =
                page.getBoundingClientRect();


            let x =
                event.clientX -
                pageRect.left -
                offsetX;


            let y =
                event.clientY -
                pageRect.top -
                offsetY;


            x =
                Math.max(
                    0,
                    Math.min(
                        x,
                        pageRect.width -
                        marker.offsetWidth
                    )
                );


            y =
                Math.max(
                    0,
                    Math.min(
                        y,
                        pageRect.height -
                        marker.offsetHeight
                    )
                );


            marker.style.left =
                `${x}px`;


            marker.style.top =
                `${y}px`;

        }
    );


    marker.addEventListener(
        "pointerup",
        event => {

            dragging =
                false;


            if (
                marker.hasPointerCapture(
                    event.pointerId
                )
            ) {

                marker.releasePointerCapture(
                    event.pointerId
                );

            }

        }
    );


    marker.addEventListener(
        "pointercancel",
        event => {

            dragging =
                false;

        }
    );

}


// =========================================
// GUARDAR POSICIONES
// =========================================

if (
    saveSignaturePositions
) {

    saveSignaturePositions.addEventListener(
        "click",
        saveAllSignaturePositions
    );

}


async function saveAllSignaturePositions() {

    configMessage.textContent =
        "Guardando posiciones...";


    try {

        const slots = [
            "BEFORE_RECESS",
            "AFTER_RECESS"
        ];


        for (
            const slot of slots
        ) {

            const marker =
                signatureMarkers[
                    slot
                ];


            if (!marker) {
                continue;
            }


            const page =
                marker.parentElement;


            const pageNumber =
                Number(
                    page.dataset.page
                );


            const x =
                parseFloat(
                    marker.style.left
                );


            const y =
                parseFloat(
                    marker.style.top
                );


            const width =
                marker.offsetWidth;


            const height =
                marker.offsetHeight;


            const {
                error
            } =
                await supabaseClient
                    .from(
                        "document_signatures"
                    )
                    .update({

                        signature_page:
                            pageNumber,

                        signature_x:
                            x,

                        signature_y:
                            y,

                        signature_width:
                            width,

                        signature_height:
                            height

                    })
                    .eq(
                        "document_id",
                        documentId
                    )
                    .eq(
                        "signature_slot",
                        slot
                    );


            if (error) {

                throw error;

            }

        }


        configMessage.textContent =
            "✓ Posiciones guardadas correctamente.";

    }

    catch (error) {

        console.error(
            "Error guardando posiciones:",
            error
        );


        configMessage.textContent =
            `No se pudieron guardar las posiciones: ${error.message}`;

    }

}


// =========================================
// CERRAR CONFIGURADOR
// =========================================

if (
    closeSignatureConfigurator
) {

    closeSignatureConfigurator.addEventListener(
        "click",
        () => {

            signatureConfigurator.classList.add(
                "hidden"
            );

        }
    );

}


// =========================================
// CARGAR DOCUMENTO FIRMADO
// =========================================

async function loadSignedDocument() {

    // Si el HTML no tiene estos elementos,
    // simplemente no hacemos nada.

    if (
        !signedDocumentContainer ||
        !viewSignedDocumentButton
    ) {

        console.warn(
            "Elementos del documento firmado no encontrados."
        );

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("documents")
                .select(
                    "id, signed_file_path"
                )
                .eq(
                    "id",
                    documentId
                )
                .single();


        if (error) {

            console.error(
                "Error buscando documento firmado:",
                error
            );

            signedDocumentContainer.style.display =
                "none";

            return;

        }


        // =====================================
        // NO EXISTE PDF FIRMADO
        // =====================================

        if (
            !data ||
            !data.signed_file_path
        ) {

            signedDocumentContainer.style.display =
                "none";

            return;

        }


        // =====================================
        // MOSTRAR BOTÓN
        // =====================================

        signedDocumentContainer.style.display =
            "block";


        if (
            signedDocumentMessage
        ) {

            signedDocumentMessage.textContent =
                "";

        }


        // =====================================
        // BOTÓN
        // =====================================

        viewSignedDocumentButton.onclick =
            async function () {

                try {

                    viewSignedDocumentButton.disabled =
                        true;


                    viewSignedDocumentButton.textContent =
                        "⏳ Abriendo documento...";


                    if (
                        signedDocumentMessage
                    ) {

                        signedDocumentMessage.textContent =
                            "Generando acceso al documento firmado...";

                    }


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
                                data.signed_file_path,
                                3600
                            );


                    if (signedError) {

                        throw signedError;

                    }


                    if (
                        !signedData ||
                        !signedData.signedUrl
                    ) {

                        throw new Error(
                            "No se pudo generar la URL del documento firmado."
                        );

                    }


                    console.log(
                        "URL documento firmado:",
                        signedData.signedUrl
                    );


                    // =================================
                    // ABRIR PDF
                    // =================================

                    const newWindow =
                        window.open(
                            signedData.signedUrl,
                            "_blank"
                        );


                    if (!newWindow) {

                        throw new Error(
                            "El navegador bloqueó la ventana emergente. Permite ventanas emergentes para este sitio."
                        );

                    }


                    if (
                        signedDocumentMessage
                    ) {

                        signedDocumentMessage.textContent =
                            "Documento firmado abierto correctamente.";

                    }

                }

                catch (error) {

                    console.error(
                        "Error abriendo documento firmado:",
                        error
                    );


                    if (
                        signedDocumentMessage
                    ) {

                        signedDocumentMessage.textContent =
                            `No se pudo abrir el documento: ${error.message}`;

                    }

                    else {

                        alert(
                            `No se pudo abrir el documento:\n\n${error.message}`
                        );

                    }

                }

                finally {

                    viewSignedDocumentButton.disabled =
                        false;


                    viewSignedDocumentButton.textContent =
                        "📄 Ver documento firmado";

                }

            };

    }

    catch (error) {

        console.error(
            "Error cargando documento firmado:",
            error
        );

    }

}


// =========================================
// ACTUALIZACIÓN EN TIEMPO REAL
// =========================================

function listenForSignatureChanges() {

    supabaseClient
        .channel(
            `document-signatures-${documentId}`
        )
        .on(
            "postgres_changes",
            {
                event:
                    "UPDATE",

                schema:
                    "public",

                table:
                    "document_signatures",

                filter:
                    `document_id=eq.${documentId}`

            },
            async payload => {

                console.log(
                    "Firma actualizada:",
                    payload.new
                );


                await loadSignatures();

                await loadDocument();

                await loadSignedDocument();

            }
        )
        .subscribe();

}


// =========================================
// INICIAR
// =========================================

async function init() {

    try {

        await loadDocument();

        await loadSignatures();

        await loadSignedDocument();

        listenForSignatureChanges();

    }

    catch (error) {

        console.error(
            "Error iniciando document.js:",
            error
        );

    }

}


init();
